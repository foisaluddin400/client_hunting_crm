import tls from "tls";
import https from "https";
import http from "http";
import { URL } from "url";
import { AuditCheckItem, AuditProblemItem, AuditCheckStatus } from "./types";

export interface AuditEngineResult {
  overallScore: number;
  scores: {
    pageSpeed: number;
    lighthouse: number;
    mobile: number;
    uxTechnicalDesign: number;
  };
  checks: AuditCheckItem[];
  problems: AuditProblemItem[];
  recommendedImprovements: string[];
  recommendedFeatures: string[];
  businessRecommendations: string[];
  clientSummary: string;
}

interface FetchedPage {
  url: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  ttfbMs: number;
  totalTimeMs: number;
  contentLength: number;
  isHttps: boolean;
  redirectedToHttps: boolean;
  sslValid: boolean;
  sslIssuer?: string;
  sslDaysRemaining?: number;
}

// Normalize user-supplied URL to valid URL object with protocol
export function normalizeWebsiteUrl(rawUrl: string): string {
  let cleaned = rawUrl.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }
  return cleaned;
}

// Fetch web page and measure performance timings, headers, and SSL details
async function fetchPageDetails(targetUrl: string): Promise<FetchedPage> {
  const parsed = new URL(targetUrl);
  const startTime = Date.now();
  let ttfb = 0;

  // First check SSL certificate details if HTTPS
  let sslValid = false;
  let sslIssuer: string | undefined;
  let sslDaysRemaining: number | undefined;

  if (parsed.protocol === "https:") {
    try {
      const certInfo = await new Promise<{
        valid: boolean;
        issuer?: string;
        daysRemaining?: number;
      }>((resolve) => {
        const socket = tls.connect(
          {
            host: parsed.hostname,
            port: parsed.port ? parseInt(parsed.port, 10) : 443,
            servername: parsed.hostname,
            timeout: 5000,
            rejectUnauthorized: false,
          },
          () => {
            const cert = socket.getPeerCertificate();
            const authorized = socket.authorized;
            let days: number | undefined;
            if (cert && cert.valid_to) {
              const expiry = new Date(cert.valid_to).getTime();
              days = Math.max(0, Math.floor((expiry - Date.now()) / (1000 * 60 * 60 * 24)));
            }
            const issuerRaw = cert?.issuer?.O || cert?.issuer?.CN;
            const issuer = Array.isArray(issuerRaw) ? issuerRaw.join(", ") : (issuerRaw || "Unknown Issuer");
            socket.destroy();
            resolve({ valid: authorized || (days !== undefined && days > 0), issuer, daysRemaining: days });
          }
        );

        socket.on("error", () => resolve({ valid: false }));
        socket.on("timeout", () => {
          socket.destroy();
          resolve({ valid: false });
        });
      });

      sslValid = certInfo.valid;
      sslIssuer = certInfo.issuer;
      sslDaysRemaining = certInfo.daysRemaining;
    } catch {
      sslValid = false;
    }
  }

  // Check HTTP to HTTPS redirect behavior
  let redirectedToHttps = false;
  try {
    const httpCheckUrl = `http://${parsed.hostname}${parsed.pathname || "/"}`;
    const httpCheck = await fetch(httpCheckUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    }).catch(() => null);

    if (httpCheck) {
      const loc = httpCheck.headers.get("location") || "";
      if (
        (httpCheck.status >= 301 && httpCheck.status <= 308 && loc.startsWith("https://")) ||
        parsed.protocol === "https:"
      ) {
        redirectedToHttps = true;
      }
    }
  } catch {
    redirectedToHttps = parsed.protocol === "https:";
  }

  // Fetch full page content
  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 LeadFlowWebsiteAudit/1.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });

  ttfb = Date.now() - startTime;
  const html = await res.text();
  const totalTimeMs = Date.now() - startTime;

  const headerObj: Record<string, string> = {};
  res.headers.forEach((val, key) => {
    headerObj[key.toLowerCase()] = val;
  });

  return {
    url: targetUrl,
    finalUrl: res.url || targetUrl,
    statusCode: res.status,
    headers: headerObj,
    html,
    ttfbMs: ttfb,
    totalTimeMs,
    contentLength: html.length,
    isHttps: (res.url || targetUrl).startsWith("https://"),
    redirectedToHttps: redirectedToHttps || (res.url || targetUrl).startsWith("https://"),
    sslValid,
    sslIssuer,
    sslDaysRemaining,
  };
}

// Sample external/internal links responsibly (max 10 links) to check for 404 broken links
async function checkBrokenLinks(html: string, baseUrl: string): Promise<{
  totalChecked: number;
  brokenCount: number;
  brokenUrls: string[];
}> {
  const linkRegex = /href=["']([^"'#\s>]+)["']/gi;
  const discovered = new Set<string>();
  let match;

  const baseOrigin = new URL(baseUrl).origin;

  while ((match = linkRegex.exec(html)) !== null && discovered.size < 25) {
    let href = match[1].trim();
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    try {
      const full = new URL(href, baseUrl).href;
      // Exclude asset files like images/css to only test page links
      if (!/\.(jpg|jpeg|png|gif|svg|webp|css|js|woff|woff2|ttf|pdf)$/i.test(full)) {
        discovered.add(full);
      }
    } catch {}
  }

  const toTest = Array.from(discovered).slice(0, 10);
  if (toTest.length === 0) {
    return { totalChecked: 0, brokenCount: 0, brokenUrls: [] };
  }

  const broken: string[] = [];

  await Promise.all(
    toTest.map(async (linkUrl) => {
      try {
        const res = await fetch(linkUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(3500),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadFlowLinkChecker/1.0",
          },
        });
        if (res.status >= 400 && res.status < 600) {
          broken.push(linkUrl);
        }
      } catch {
        // Retry with GET if HEAD was method-not-allowed
        try {
          const getRes = await fetch(linkUrl, {
            method: "GET",
            signal: AbortSignal.timeout(3500),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadFlowLinkChecker/1.0",
            },
          });
          if (getRes.status >= 400 && getRes.status < 600) {
            broken.push(linkUrl);
          }
        } catch {
          broken.push(linkUrl);
        }
      }
    })
  );

  return {
    totalChecked: toTest.length,
    brokenCount: broken.length,
    brokenUrls: broken,
  };
}

// Check robots.txt presence and valid directives
async function checkRobotsTxt(origin: string): Promise<{ exists: boolean; status: number; hasSitemap: boolean }> {
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const res = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "LeadFlowWebsiteAudit/1.0" },
    });
    if (res.ok) {
      const text = await res.text();
      const hasUserAgent = /user-agent:/i.test(text);
      const hasSitemap = /sitemap:/i.test(text);
      return { exists: hasUserAgent || text.trim().length > 10, status: res.status, hasSitemap };
    }
    return { exists: false, status: res.status, hasSitemap: false };
  } catch {
    return { exists: false, status: 0, hasSitemap: false };
  }
}

// Check sitemap.xml presence
async function checkSitemapXml(origin: string, declaredInRobots = false): Promise<{ exists: boolean; status: number }> {
  try {
    const sitemapUrl = `${origin}/sitemap.xml`;
    const res = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "LeadFlowWebsiteAudit/1.0" },
    });
    if (res.ok) {
      const text = await res.text();
      const isXml = /<urlset|<sitemapindex|\?xml/i.test(text);
      return { exists: isXml || res.status === 200, status: res.status };
    }
    return { exists: declaredInRobots, status: res.status };
  } catch {
    return { exists: declaredInRobots, status: 0 };
  }
}

// Deterministic category recommendations generator based on lead niche
function getCategoryRecommendations(category?: string, businessName = "the business"): string[] {
  const cat = (category || "").toLowerCase();

  if (cat.includes("restaurant") || cat.includes("cafe") || cat.includes("food") || cat.includes("bar") || cat.includes("bakery") || cat.includes("pizza") || cat.includes("bistro")) {
    return [
      `Implement an interactive, mobile-optimized online menu with high-resolution food photography.`,
      `Add direct 1-click table reservation or online ordering widget (e.g. OpenTable, Toast, or direct WhatsApp ordering) to cut third-party commission fees.`,
      `Showcase dynamic Google Reviews and food hygiene certifications prominently on the homepage to build instant diner trust.`,
      `Add clear operating hours and 1-tap Google Maps directions right at the top of the mobile viewport.`,
    ];
  }

  if (cat.includes("plumb") || cat.includes("electric") || cat.includes("hvac") || cat.includes("clean") || cat.includes("roof") || cat.includes("solar") || cat.includes("contractor") || cat.includes("paint") || cat.includes("landscap")) {
    return [
      `Add a sticky "Emergency 24/7 Call Now" floating button on mobile devices to capture immediate high-ticket emergency calls.`,
      `Install an instant "Get a Free Instant Quote" request form with simple step-by-step service selection.`,
      `Display verified local customer reviews, before-and-after photo galleries, and proof of license and insurance.`,
      `Target localized service area landing pages (e.g. "Emergency Plumber in [City]") to capture high-intent Google searches.`,
    ];
  }

  if (cat.includes("dent") || cat.includes("clinic") || cat.includes("doctor") || cat.includes("health") || cat.includes("chiro") || cat.includes("physio") || cat.includes("therap")) {
    return [
      `Integrate a 24/7 self-service online appointment booking system so patients can book outside office hours.`,
      `Add patient testimonials, doctor credentials, and insurance provider badges to alleviate patient anxiety.`,
      `Ensure full compliance with accessibility standards (ADA / WCAG) and HIPAA/privacy compliance for online patient forms.`,
      `Add clear emergency contact pathways and new-patient welcome packages to increase initial appointment conversions.`,
    ];
  }

  if (cat.includes("real estate") || cat.includes("realtor") || cat.includes("property") || cat.includes("estate agent") || cat.includes("mortgage")) {
    return [
      `Provide an interactive property search with neighborhood filters, virtual 3D tour embeds, and instant booking for viewings.`,
      `Embed an automated "Instant Home Valuation Calculator" to collect high-value home seller contact information.`,
      `Feature prominent agent profiles, local market statistics, and client video success stories.`,
      `Implement automated WhatsApp/SMS notifications for new listing inquiries.`,
    ];
  }

  if (cat.includes("law") || cat.includes("legal") || cat.includes("attorney") || cat.includes("solicitor")) {
    return [
      `Add a prominent, confidential "Free Case Evaluation" form at the top of the homepage.`,
      `Feature attorney case results, settlements won, and verified legal directory ratings (Avvo, SuperLawyers).`,
      `Create distinct practice area landing pages with clear FAQs explaining typical client concerns.`,
      `Add a 24/7 live chat or intake messaging widget to capture emergency inquiries.`,
    ];
  }

  // General local business recommendations
  return [
    `Add clear, high-contrast Call-To-Action (CTA) buttons ("Request a Quote", "Book Now", "Contact Us") visible above the fold on all screen sizes.`,
    `Embed direct WhatsApp or SMS chat for quick client inquiries to reduce barrier to contact.`,
    `Feature real customer reviews and trust badges on the homepage to increase conversion by up to 34%.`,
    `Optimize page loading speed for mobile users to prevent bounce rates and improve local Google rankings.`,
  ];
}

// Main execution function for deterministic rule-based website audit
export async function performWebsiteAudit(
  url: string,
  businessInfo: { businessName: string; category?: string; location?: string }
): Promise<AuditEngineResult> {
  const normalizedUrl = normalizeWebsiteUrl(url);
  const parsed = new URL(normalizedUrl);
  const origin = parsed.origin;

  let page: FetchedPage;
  try {
    page = await fetchPageDetails(normalizedUrl);
  } catch (err: any) {
    // If initial fetch failed, try fallback protocol or report website down
    if (normalizedUrl.startsWith("https://")) {
      try {
        const httpFallback = normalizedUrl.replace(/^https:\/\//i, "http://");
        page = await fetchPageDetails(httpFallback);
      } catch {
        return createFailedAuditResult(normalizedUrl, businessInfo, err.message || "Website is unreachable or connection timed out.");
      }
    } else {
      return createFailedAuditResult(normalizedUrl, businessInfo, err.message || "Website is unreachable or connection timed out.");
    }
  }

  // Run secondary checks in parallel
  const [robotsInfo, brokenLinksInfo] = await Promise.all([
    checkRobotsTxt(origin),
    checkBrokenLinks(page.html, page.finalUrl),
  ]);

  const sitemapInfo = await checkSitemapXml(origin, robotsInfo.hasSitemap);

  // Parse HTML elements safely using regex
  const html = page.html;

  // 1. Meta Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const metaTitle = titleMatch ? titleMatch[1].trim() : null;

  // 2. Meta Description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : null;

  // 3. H1 Tags
  const h1Matches = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map((m) =>
    m[1].replace(/<[^>]*>/g, "").trim()
  ).filter((h) => h.length > 0);

  // 4. Viewport
  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["']/i);
  const hasViewport = Boolean(viewportMatch && viewportMatch[1].includes("width="));

  // 5. Image Alt Attributes
  const imgMatches = Array.from(html.matchAll(/<img\s+([^>]*?)>/gi));
  let totalImages = imgMatches.length;
  let imagesWithAlt = 0;
  for (const img of imgMatches) {
    const attrs = img[1];
    if (/alt=["'][^"']+["']/i.test(attrs)) {
      imagesWithAlt++;
    }
  }

  // 6. Basic SEO elements
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);

  // 7. Contact Information
  const hasMailto = /href=["']mailto:[^"']+["']/i.test(html);
  const hasTel = /href=["']tel:[^"']+["']/i.test(html);
  const hasContactLink = /href=["'][^"']*(contact|touch|reach|about-us)[^"']*["']/i.test(html);
  const hasForm = /<form[^>]*>/i.test(html);

  // 8. CTA Presence
  const ctaRegex = /(book\s+now|order\s+online|contact\s+us|get\s+a\s+quote|get\s+quote|free\s+consultation|schedule|call\s+now|request\s+service|get\s+started|reserve\s+table|appointment)/i;
  const hasCta = ctaRegex.test(html);

  // 9. Technical Design / UX Signals
  const hasFavicon = /<link[^>]+rel=["'](shortcut icon|icon|apple-touch-icon)["']/i.test(html);
  const hasMediaQueries = /@media[^{]+{/i.test(html) || /class=["'][^"']*(sm:|md:|lg:|flex|grid|col-|row-)[^"']*["']/i.test(html);

  // Build Individual Checks Array
  const checks: AuditCheckItem[] = [];
  const problems: AuditProblemItem[] = [];
  const recommendedImprovements: string[] = [];
  const recommendedFeatures: string[] = [];

  // Check: Website Availability
  const isAvailable = page.statusCode >= 200 && page.statusCode < 400;
  checks.push({
    id: "website",
    label: "Website Availability",
    status: isAvailable ? "Passed" : "Failed",
    value: isAvailable ? `Online (${page.statusCode} • ${page.ttfbMs}ms)` : `Error (${page.statusCode})`,
    message: isAvailable
      ? `Website is responding quickly with HTTP ${page.statusCode}. Time to First Byte is ${page.ttfbMs}ms.`
      : `Website returned HTTP status ${page.statusCode}. Potential server or hosting issue.`,
    whyItMatters: "If a website is down or slow to respond, visitors bounce immediately and Google penalizes search rankings.",
  });
  if (!isAvailable) {
    problems.push({
      id: "prob-availability",
      severity: "high",
      title: "Website Downtime / Server Error",
      description: `Target server responded with HTTP status ${page.statusCode}.`,
    });
    recommendedImprovements.push("Investigate web server status and resolve server configuration errors.");
  }

  // Check: SSL
  const isSslPassed = page.isHttps && page.sslValid;
  checks.push({
    id: "ssl",
    label: "SSL Certificate",
    status: isSslPassed ? "Passed" : page.isHttps ? "Needs improvement" : "Failed",
    value: isSslPassed
      ? `Valid (${page.sslIssuer || "TLS active"}${page.sslDaysRemaining ? ` • ${page.sslDaysRemaining}d remaining` : ""})`
      : page.isHttps
      ? "Certificate Warning"
      : "No SSL",
    message: isSslPassed
      ? `Active, valid SSL/TLS certificate detected from ${page.sslIssuer || "trusted authority"}.`
      : `SSL certificate is either invalid, untrusted, or missing.`,
    whyItMatters: "Browsers mark sites without valid SSL certificates as 'Not Secure', causing up to 85% of visitors to leave immediately.",
  });
  if (!isSslPassed) {
    problems.push({
      id: "prob-ssl",
      severity: "high",
      title: "Missing or Invalid SSL Certificate",
      description: "Website does not have a properly verified SSL certificate.",
    });
    recommendedImprovements.push("Install a verified SSL certificate (e.g. via Let's Encrypt or Cloudflare) to ensure all traffic is encrypted.");
  }

  // Check: HTTPS
  const isHttpsRedirectPassed = page.redirectedToHttps && page.isHttps;
  checks.push({
    id: "https",
    label: "HTTPS Enforcement",
    status: isHttpsRedirectPassed ? "Passed" : page.isHttps ? "Needs improvement" : "Failed",
    value: isHttpsRedirectPassed ? "Enforced (301 redirect)" : page.isHttps ? "Active (No auto-redirect)" : "HTTP Only",
    message: isHttpsRedirectPassed
      ? "HTTP traffic automatically redirects to secure HTTPS protocol."
      : page.isHttps
      ? "HTTPS is accessible, but plain HTTP does not automatically force-redirect to HTTPS."
      : "Website is running over insecure HTTP protocol.",
    whyItMatters: "Google uses HTTPS as a core ranking signal. Forcing all traffic to HTTPS protects user data and ensures consistent SEO authority.",
  });
  if (!isHttpsRedirectPassed && page.isHttps) {
    problems.push({
      id: "prob-https-redirect",
      severity: "medium",
      title: "HTTP to HTTPS Redirect Not Enforced",
      description: "Users visiting http:// are not automatically redirected to secure https://.",
    });
    recommendedImprovements.push("Add a 301 server redirect rule from HTTP to HTTPS in server config (.htaccess or Nginx).");
  }

  // Check: Meta Title
  let titleStatus: "Passed" | "Needs improvement" | "Failed" = "Passed";
  let titleVal = metaTitle ? `${metaTitle.length} chars` : "Missing";
  let titleMsg = "";
  if (!metaTitle) {
    titleStatus = "Failed";
    titleMsg = "No <title> tag found on the page.";
    problems.push({
      id: "prob-title-missing",
      severity: "high",
      title: "Missing Page Meta Title",
      description: "Search engines and social platforms cannot identify page topic without a title.",
    });
    recommendedImprovements.push("Add a descriptive <title> tag between 30 and 60 characters containing business name and primary service.");
  } else if (metaTitle.length < 25) {
    titleStatus = "Needs improvement";
    titleMsg = `Meta title is too short (${metaTitle.length} characters). Ideal length is 30-60 characters.`;
    problems.push({
      id: "prob-title-short",
      severity: "low",
      title: "Meta Title Too Short",
      description: `Current title is only ${metaTitle.length} characters: "${metaTitle}".`,
    });
    recommendedImprovements.push("Expand the meta title to include primary keywords, business name, and target city.");
  } else if (metaTitle.length > 70) {
    titleStatus = "Needs improvement";
    titleMsg = `Meta title is too long (${metaTitle.length} characters) and will be truncated in Google search results.`;
    problems.push({
      id: "prob-title-long",
      severity: "low",
      title: "Meta Title Too Long",
      description: `Current title is ${metaTitle.length} characters and will be cut off in search snippets.`,
    });
    recommendedImprovements.push("Condense the meta title to under 60 characters for clean Google search display.");
  } else {
    titleMsg = `Optimal title found: "${metaTitle.length > 45 ? metaTitle.substring(0, 45) + "..." : metaTitle}" (${metaTitle.length} chars).`;
  }
  checks.push({
    id: "metaTitle",
    label: "Meta Title",
    status: titleStatus,
    value: titleVal,
    message: titleMsg,
    whyItMatters: "The meta title is the primary headline displayed in Google search results. It has a heavy impact on click-through rates and SEO ranking.",
  });

  // Check: Meta Description
  let descStatus: "Passed" | "Needs improvement" | "Failed" = "Passed";
  let descVal = metaDescription ? `${metaDescription.length} chars` : "Missing";
  let descMsg = "";
  if (!metaDescription) {
    descStatus = "Failed";
    descMsg = "No meta description found. Search engines will generate arbitrary text snippets.";
    problems.push({
      id: "prob-desc-missing",
      severity: "medium",
      title: "Missing Meta Description",
      description: "No meta description tag found, hurting organic click-through rates on search results.",
    });
    recommendedImprovements.push("Add a compelling 120-160 character meta description summarizing services, unique value, and a CTA.");
  } else if (metaDescription.length < 70) {
    descStatus = "Needs improvement";
    descMsg = `Meta description is short (${metaDescription.length} chars). Target 120-160 characters for maximum search visibility.`;
    problems.push({
      id: "prob-desc-short",
      severity: "low",
      title: "Meta Description Too Short",
      description: `Current description is only ${metaDescription.length} characters.`,
    });
    recommendedImprovements.push("Expand the meta description to include core services, business value proposition, and a clear call to action.");
  } else if (metaDescription.length > 175) {
    descStatus = "Needs improvement";
    descMsg = `Meta description is too long (${metaDescription.length} chars) and will be cut off in search snippets.`;
  } else {
    descMsg = `Well-formatted meta description detected (${metaDescription.length} chars).`;
  }
  checks.push({
    id: "metaDescription",
    label: "Meta Description",
    status: descStatus,
    value: descVal,
    message: descMsg,
    whyItMatters: "A persuasive meta description acts as your free organic ad copy in Google, directly driving click-through rates from searchers.",
  });

  // Check: H1 Heading
  let h1Status: "Passed" | "Needs improvement" | "Failed" = "Passed";
  let h1Val = `${h1Matches.length} tag${h1Matches.length === 1 ? "" : "s"}`;
  let h1Msg = "";
  if (h1Matches.length === 0) {
    h1Status = "Failed";
    h1Msg = "No <h1> heading tag found on the page.";
    problems.push({
      id: "prob-h1-missing",
      severity: "medium",
      title: "Missing H1 Heading Tag",
      description: "The page lacks a primary H1 tag, making it harder for search engines to determine content hierarchy.",
    });
    recommendedImprovements.push("Add a single clear <h1> headline at the top of the homepage stating your core service and value proposition.");
  } else if (h1Matches.length > 1) {
    h1Status = "Needs improvement";
    h1Msg = `Multiple H1 tags found (${h1Matches.length}). Best practice is exactly one H1 per page.`;
    problems.push({
      id: "prob-h1-multiple",
      severity: "low",
      title: "Multiple H1 Tags Detected",
      description: `Found ${h1Matches.length} H1 tags. Using multiple H1s can confuse search engine crawlers regarding the main page topic.`,
    });
    recommendedImprovements.push("Ensure there is only one primary <h1> tag, and use <h2> and <h3> for secondary section headings.");
  } else {
    h1Msg = `Single well-structured H1 detected: "${h1Matches[0].length > 40 ? h1Matches[0].substring(0, 40) + "..." : h1Matches[0]}".`;
  }
  checks.push({
    id: "h1",
    label: "H1 Heading Structure",
    status: h1Status,
    value: h1Val,
    message: h1Msg,
    whyItMatters: "The H1 tag tells Google and screen readers the main topic of your page. Having exactly one clean H1 is a fundamental on-page SEO requirement.",
  });

  // Check: Broken Links
  let brokenStatus: AuditCheckStatus = "Passed";
  let brokenVal = `${brokenLinksInfo.brokenCount} broken / ${brokenLinksInfo.totalChecked} tested`;
  let brokenMsg = "";
  if (brokenLinksInfo.totalChecked === 0) {
    brokenStatus = "N/A";
    brokenVal = "None found";
    brokenMsg = "No internal/external links were detected in the homepage HTML.";
  } else if (brokenLinksInfo.brokenCount === 0) {
    brokenMsg = `All ${brokenLinksInfo.totalChecked} sample page links responded successfully with no 404 errors.`;
  } else if (brokenLinksInfo.brokenCount <= 2) {
    brokenStatus = "Needs improvement";
    brokenMsg = `${brokenLinksInfo.brokenCount} broken link(s) found out of ${brokenLinksInfo.totalChecked} tested.`;
    problems.push({
      id: "prob-broken-links",
      severity: "medium",
      title: "Broken Links Detected (404 Not Found)",
      description: `Found ${brokenLinksInfo.brokenCount} broken link(s): ${brokenLinksInfo.brokenUrls.slice(0, 2).join(", ")}.`,
    });
    recommendedImprovements.push("Fix or remove broken internal links to prevent user frustration and crawl budget waste.");
  } else {
    brokenStatus = "Failed";
    brokenMsg = `${brokenLinksInfo.brokenCount} broken link(s) detected out of ${brokenLinksInfo.totalChecked} tested.`;
    problems.push({
      id: "prob-broken-links-high",
      severity: "high",
      title: "Multiple Broken Links on Homepage",
      description: `${brokenLinksInfo.brokenCount} links on the page lead to dead 404 pages.`,
    });
    recommendedImprovements.push("Conduct a comprehensive link audit to repair all dead URLs and broken redirects.");
  }
  checks.push({
    id: "brokenLinks",
    label: "Broken Links",
    status: brokenStatus,
    value: brokenVal,
    message: brokenMsg,
    whyItMatters: "Broken links create dead ends for potential customers, hurt conversion rates, and signal poor site maintenance to search engines.",
  });

  // Check: Sitemap.xml
  checks.push({
    id: "sitemap",
    label: "Sitemap.xml",
    status: sitemapInfo.exists ? "Passed" : "Needs improvement",
    value: sitemapInfo.exists ? "Available" : "Not Found",
    message: sitemapInfo.exists
      ? "XML sitemap found, enabling search engines to discover and index all site pages."
      : "No sitemap.xml detected at standard location or in robots.txt.",
    whyItMatters: "A sitemap acts as a roadmap for Google crawlers, guaranteeing that all important pages and services get indexed.",
  });
  if (!sitemapInfo.exists) {
    problems.push({
      id: "prob-sitemap",
      severity: "low",
      title: "Missing XML Sitemap",
      description: "Could not locate sitemap.xml on the web server.",
    });
    recommendedImprovements.push("Generate and submit an XML sitemap to Google Search Console to speed up page indexing.");
  }

  // Check: Robots.txt
  checks.push({
    id: "robots",
    label: "Robots.txt",
    status: robotsInfo.exists ? "Passed" : "Needs improvement",
    value: robotsInfo.exists ? "Available" : "Missing",
    message: robotsInfo.exists
      ? "Valid robots.txt file found to guide search engine web crawlers."
      : "No robots.txt file detected. Search crawlers have no indexing guidelines.",
    whyItMatters: "Robots.txt guides search engines on which pages to crawl and prevents indexation of sensitive administrative routes.",
  });
  if (!robotsInfo.exists) {
    recommendedImprovements.push("Add a standard robots.txt file with proper User-agent and Sitemap directives.");
  }

  // Check: Image Alt Attributes
  let altStatus: "Passed" | "Needs improvement" | "Failed" = "Passed";
  let altVal = totalImages > 0 ? `${imagesWithAlt}/${totalImages} with alt` : "0 images";
  let altMsg = "";
  if (totalImages === 0) {
    altStatus = "Passed";
    altMsg = "No image tags found on the homepage.";
  } else {
    const coverage = Math.round((imagesWithAlt / totalImages) * 100);
    if (coverage >= 85) {
      altStatus = "Passed";
      altMsg = `Strong image accessibility: ${coverage}% of images have alt text.`;
    } else if (coverage >= 50) {
      altStatus = "Needs improvement";
      altMsg = `Partial alt coverage: ${coverage}% (${imagesWithAlt} of ${totalImages}). Several images are missing descriptive alt text.`;
      problems.push({
        id: "prob-img-alt",
        severity: "medium",
        title: "Images Missing Alt Attributes",
        description: `${totalImages - imagesWithAlt} image(s) on the homepage have empty or missing alt text.`,
      });
      recommendedImprovements.push("Add descriptive alt tags to all images for improved Google Image SEO and screen-reader accessibility.");
    } else {
      altStatus = "Failed";
      altMsg = `Poor alt coverage: Only ${coverage}% of images have alt text. Major accessibility and SEO gap.`;
      problems.push({
        id: "prob-img-alt-high",
        severity: "medium",
        title: "Majority of Images Lack Alt Text",
        description: `${totalImages - imagesWithAlt} out of ${totalImages} images do not have alt tags.`,
      });
      recommendedImprovements.push("Audit all site images and provide relevant, keyword-rich alt descriptions.");
    }
  }
  checks.push({
    id: "imageAlt",
    label: "Image Alt Attributes",
    status: altStatus,
    value: altVal,
    message: altMsg,
    whyItMatters: "Alt tags allow visually impaired users to understand images and allow Google Images to index your visual assets.",
  });

  // Check: Mobile Viewport
  checks.push({
    id: "mobile",
    label: "Mobile Viewport",
    status: hasViewport ? "Passed" : "Failed",
    value: hasViewport ? "Configured" : "Missing",
    message: hasViewport
      ? "Proper mobile viewport meta tag configured for responsive mobile rendering."
      : "No viewport meta tag found! Website will render as desktop version on mobile devices.",
    whyItMatters: "Over 65% of local web traffic comes from smartphones. Without a viewport tag, mobile users see broken, unreadable layouts.",
  });
  if (!hasViewport) {
    problems.push({
      id: "prob-viewport",
      severity: "high",
      title: "Missing Mobile Viewport Tag",
      description: "The site lacks a mobile viewport tag, rendering improperly on mobile screens.",
    });
    recommendedImprovements.push('Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.');
  }

  // Check: Page Speed
  // Calculate deterministic Page Speed score (0-100)
  let speedScore = 100;
  if (page.ttfbMs > 800) speedScore -= 30;
  else if (page.ttfbMs > 450) speedScore -= 18;
  else if (page.ttfbMs > 250) speedScore -= 8;

  if (page.totalTimeMs > 2500) speedScore -= 20;
  else if (page.totalTimeMs > 1500) speedScore -= 10;

  if (page.contentLength > 500000) speedScore -= 15;
  else if (page.contentLength > 200000) speedScore -= 8;

  const hasCompression = Boolean(
    page.headers["content-encoding"] &&
    /gzip|br|deflate/i.test(page.headers["content-encoding"])
  );
  if (!hasCompression) speedScore -= 12;

  speedScore = Math.max(25, Math.min(99, speedScore));

  let speedStatus: "Passed" | "Needs improvement" | "Failed" = "Passed";
  if (speedScore < 60) speedStatus = "Failed";
  else if (speedScore < 80) speedStatus = "Needs improvement";

  checks.push({
    id: "pageSpeed",
    label: "Page Speed",
    status: speedStatus,
    value: `${speedScore}/100 (${page.ttfbMs}ms TTFB)`,
    message: `Initial server response time was ${page.ttfbMs}ms. Total page download took ${page.totalTimeMs}ms. Compression: ${hasCompression ? "Active" : "None"}.`,
    whyItMatters: "Every 1-second delay in page load time reduces conversions by 7%. Fast sites rank significantly higher on mobile Google search.",
  });
  if (speedScore < 80) {
    problems.push({
      id: "prob-speed",
      severity: speedScore < 60 ? "high" : "medium",
      title: "Suboptimal Page Load Speed",
      description: `Server response time (${page.ttfbMs}ms) is slower than recommended (<200ms).`,
    });
    recommendedImprovements.push("Enable Gzip/Brotli compression, leverage browser caching, and optimize hero images to improve load speed.");
  }

  // Check: Basic SEO
  const seoItems: string[] = [];
  if (canonicalMatch) seoItems.push("Canonical Tag");
  if (langMatch) seoItems.push("HTML Lang");
  if (ogTitleMatch) seoItems.push("OpenGraph Meta");
  const isSeoPassed = seoItems.length >= 2 && titleStatus !== "Failed";
  checks.push({
    id: "basicSeo",
    label: "Basic SEO",
    status: isSeoPassed ? "Passed" : "Needs improvement",
    value: `${seoItems.length}/3 tags (${seoItems.join(", ") || "Minimal"})`,
    message: isSeoPassed
      ? `Core technical SEO tags detected: ${seoItems.join(", ")}.`
      : "Missing key SEO tags like canonical URLs or OpenGraph social preview tags.",
    whyItMatters: "Technical SEO tags help search bots understand duplicate content and format attractive social media share cards.",
  });

  // Check: Basic Accessibility
  const isAccessibilityPassed = Boolean(langMatch && (totalImages === 0 || imagesWithAlt / totalImages >= 0.7));
  checks.push({
    id: "accessibility",
    label: "Basic Accessibility",
    status: isAccessibilityPassed ? "Passed" : "Needs improvement",
    value: isAccessibilityPassed ? "Compliant" : "Needs Improvement",
    message: isAccessibilityPassed
      ? "Valid HTML language attribute and acceptable image alt text coverage."
      : "Missing HTML language attribute or deficient image alt descriptions for screen readers.",
    whyItMatters: "Accessible sites reach more potential buyers and avoid legal liability under digital accessibility regulations.",
  });

  // Check: Contact Information
  const detectedContacts: string[] = [];
  if (hasTel) detectedContacts.push("Click-to-Call Phone");
  if (hasMailto) detectedContacts.push("Email Link");
  if (hasContactLink) detectedContacts.push("Contact Page");
  if (hasForm) detectedContacts.push("Contact Form");

  const isContactPassed = detectedContacts.length >= 2;
  checks.push({
    id: "contactInfo",
    label: "Contact Information",
    status: isContactPassed ? "Passed" : detectedContacts.length > 0 ? "Needs improvement" : "Failed",
    value: detectedContacts.length > 0 ? detectedContacts.slice(0, 2).join(", ") : "No direct contact links",
    message: isContactPassed
      ? `Multiple contact options available: ${detectedContacts.join(", ")}.`
      : detectedContacts.length > 0
      ? `Limited contact methods detected (${detectedContacts.join(", ")}). Missing easy contact pathways.`
      : "No direct click-to-call phone or email links found on the homepage.",
    whyItMatters: "Visitors should never have to search for a phone number or contact form. Prominent contact links double inbound inquiry rates.",
  });
  if (!isContactPassed) {
    problems.push({
      id: "prob-contact",
      severity: "high",
      title: "Missing or Inconvenient Contact Channels",
      description: "Homepage does not provide prominent click-to-call phone or fast contact form options.",
    });
    recommendedImprovements.push("Place direct click-to-call phone numbers and an interactive contact form in the homepage header and hero section.");
  }

  // Check: CTA Presence
  checks.push({
    id: "ctaPresence",
    label: "CTA Presence",
    status: hasCta ? "Passed" : "Needs improvement",
    value: hasCta ? "Detected" : "Missing / Unclear",
    message: hasCta
      ? "Clear action-oriented call-to-action buttons detected."
      : "No primary call-to-action (e.g. 'Get Quote', 'Book Now', 'Schedule') found in hero sections.",
    whyItMatters: "Websites without clear, contrasting Call-To-Action buttons suffer from low conversion rates as users leave without taking action.",
  });
  if (!hasCta) {
    problems.push({
      id: "prob-cta",
      severity: "medium",
      title: "Unclear Call-to-Action (CTA)",
      description: "No prominent action buttons detected to guide visitors toward booking or calling.",
    });
    recommendedImprovements.push("Add a high-contrast primary button (e.g. 'Get Free Quote' or 'Book Appointment') above the fold.");
  }

  // Calculate UX / Technical Design Score (0-100) strictly from measurable factors
  let uxScore = 70;
  if (hasViewport) uxScore += 10;
  if (hasCta) uxScore += 10;
  if (hasFavicon) uxScore += 5;
  if (hasMediaQueries) uxScore += 5;
  if (hasTel) uxScore += 5;
  if (!isAvailable) uxScore = 0;
  uxScore = Math.max(30, Math.min(95, uxScore));

  checks.push({
    id: "uxTechnicalDesign",
    label: "UX/Technical Design",
    status: uxScore >= 80 ? "Passed" : uxScore >= 65 ? "Needs improvement" : "Failed",
    value: `${uxScore}/100`,
    message: `Measurable UX factors: Viewport: ${hasViewport ? "✓" : "❌"}, CTA: ${hasCta ? "✓" : "❌"}, Favicon: ${hasFavicon ? "✓" : "❌"}, Mobile CSS: ${hasMediaQueries ? "✓" : "❌"}.`,
    whyItMatters: "A clean, modern user experience increases user trust and directly improves lead conversion by eliminating browsing friction.",
  });

  // Calculate Lighthouse Composite Score (0-100)
  // Weighted: Performance (30%), SEO (30%), Best Practices (20%), Accessibility (20%)
  const seoScore = Math.round(
    (titleStatus === "Passed" ? 35 : titleStatus === "Needs improvement" ? 20 : 0) +
    (descStatus === "Passed" ? 30 : descStatus === "Needs improvement" ? 15 : 0) +
    (h1Status === "Passed" ? 20 : h1Status === "Needs improvement" ? 10 : 0) +
    (sitemapInfo.exists ? 15 : 0)
  );
  const bestPracticesScore = Math.round(
    (isSslPassed ? 40 : 0) +
    (isHttpsRedirectPassed ? 30 : 0) +
    (hasFavicon ? 15 : 0) +
    (robotsInfo.exists ? 15 : 0)
  );
  const accessScore = Math.round(
    (hasViewport ? 35 : 0) +
    (altStatus === "Passed" ? 35 : altStatus === "Needs improvement" ? 20 : 0) +
    (langMatch ? 30 : 0)
  );

  const lighthouseScore = Math.round(
    speedScore * 0.3 + seoScore * 0.3 + bestPracticesScore * 0.2 + accessScore * 0.2
  );

  checks.push({
    id: "lighthouse",
    label: "Lighthouse Score",
    status: lighthouseScore >= 80 ? "Passed" : lighthouseScore >= 65 ? "Needs improvement" : "Failed",
    value: `${lighthouseScore}/100`,
    message: `Composite Lighthouse audit: Performance ${speedScore}/100, SEO ${seoScore}/100, Best Practices ${bestPracticesScore}/100, Accessibility ${accessScore}/100.`,
    whyItMatters: "Google uses Lighthouse Core Web Vitals and technical benchmarks to rank mobile websites and assess page quality.",
  });

  // Calculate Overall Score (0-100)
  const mobileScore = hasViewport ? 90 : 35;
  const overallScore = Math.round(
    speedScore * 0.25 +
    lighthouseScore * 0.3 +
    mobileScore * 0.2 +
    uxScore * 0.25
  );

  // Recommended Features
  recommendedFeatures.push(
    "Instant 24/7 online booking or quote request flow with automated SMS confirmation.",
    "Prominent Floating Click-to-Call and WhatsApp contact widget on mobile screens.",
    "Dynamic Google Review social proof carousel with star ratings and verified testimonials.",
    "Mobile-first responsive hero section featuring high-contrast Call-To-Action buttons."
  );

  // Business-specific recommendations
  const businessRecs = getCategoryRecommendations(businessInfo.category, businessInfo.businessName);

  // Client-ready pitch summary
  const clientSummary = `Hi ${businessInfo.businessName} team,

We recently conducted a technical and UX audit for ${businessInfo.businessName}'s website (${page.finalUrl}). Your business clearly has great reputation in ${businessInfo.location || "your area"}, but your current web presence scored ${overallScore}/100 due to key technical bottlenecks:

• Performance & Speed: Scored ${speedScore}/100 with a ${page.ttfbMs}ms server response latency.
• Technical SEO: ${titleStatus === "Passed" ? "Title tags active" : "Title tag needs optimization"} with ${descStatus === "Passed" ? "meta descriptions active" : "missing/weak meta description impacting search clicks"}.
• Mobile Conversion: ${hasCta ? "Action buttons found" : "Lacks prominent instant booking / call actions"}, potentially losing up to 40% of mobile inquiries.

We mapped out 3 quick, high-ROI updates (including high-speed mobile optimization and direct 1-tap booking) that can increase your inbound client leads by 25-35%. Would you be open to a 2-minute walkthrough of our recommendations?`;

  return {
    overallScore,
    scores: {
      pageSpeed: speedScore,
      lighthouse: lighthouseScore,
      mobile: mobileScore,
      uxTechnicalDesign: uxScore,
    },
    checks,
    problems,
    recommendedImprovements,
    recommendedFeatures,
    businessRecommendations: businessRecs,
    clientSummary,
  };
}

function createFailedAuditResult(
  url: string,
  businessInfo: { businessName: string; category?: string; location?: string },
  errorReason: string
): AuditEngineResult {
  return {
    overallScore: 20,
    scores: {
      pageSpeed: 10,
      lighthouse: 20,
      mobile: 30,
      uxTechnicalDesign: 20,
    },
    checks: [
      {
        id: "website",
        label: "Website Availability",
        status: "Failed",
        value: "Unreachable",
        message: `Could not connect to ${url}. ${errorReason}`,
        whyItMatters: "If a business website is completely down or unreachable, 100% of potential inbound customers and search traffic are lost.",
      },
      {
        id: "ssl",
        label: "SSL Certificate",
        status: "Failed",
        value: "Error",
        message: "Unable to verify SSL certificate because host did not respond.",
        whyItMatters: "SSL is required for security and to prevent 'Not Secure' browser warnings.",
      },
      {
        id: "https",
        label: "HTTPS Enforcement",
        status: "Failed",
        value: "Error",
        message: "Could not test HTTPS redirection.",
        whyItMatters: "HTTPS is a Google ranking factor and protects user communication.",
      },
      {
        id: "pageSpeed",
        label: "Page Speed",
        status: "Failed",
        value: "0/100",
        message: "Server timed out or refused connection.",
        whyItMatters: "Fast sites convert visitors; offline sites lose clients immediately.",
      },
      {
        id: "mobile",
        label: "Mobile Viewport",
        status: "N/A",
        value: "Unchecked",
        message: "Unable to inspect mobile viewport.",
        whyItMatters: "Mobile friendliness is vital for local client hunting.",
      },
      {
        id: "uxTechnicalDesign",
        label: "UX/Technical Design",
        status: "Failed",
        value: "20/100",
        message: "Website did not load.",
        whyItMatters: "Design and technical functionality directly govern conversion rates.",
      },
    ],
    problems: [
      {
        id: "prob-offline",
        severity: "high",
        title: "Website is Offline or Inaccessible",
        description: `Failed to connect to ${url}: ${errorReason}`,
      },
    ],
    recommendedImprovements: [
      "Check domain DNS configuration and verify that the hosting server is active.",
      "Re-establish SSL certificates and configure proper web server virtual hosts.",
    ],
    recommendedFeatures: [
      "Reliable high-speed modern cloud hosting (e.g. Vercel, Netlify, or AWS).",
      "Instant WhatsApp and Click-to-Call booking capabilities.",
    ],
    businessRecommendations: getCategoryRecommendations(businessInfo.category, businessInfo.businessName),
    clientSummary: `Hi ${businessInfo.businessName} team,\n\nWe noticed that your website (${url}) appears to be currently offline or timing out when accessed by potential clients in ${businessInfo.location || "your area"}.\n\nHaving an unreachable website costs you valuable incoming leads every single day. We can help you get a modern, lightning-fast website deployed within 48 hours. Let us know if you'd like a quick consultation!`,
  };
}
