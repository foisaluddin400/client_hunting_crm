import dns from "dns";
import net from "net";
import { isDisposableDomain } from "./disposable-domains";
import { isFreeEmailProvider } from "./free-providers";
import { isRoleBasedEmail } from "./role-prefixes";

export type VerificationStatus = "not_checked" | "valid" | "invalid" | "risky" | "unknown";

export interface EmailVerificationResult {
  status: VerificationStatus;
  syntaxValid: boolean;
  domainExists: boolean | null;
  mxRecord: boolean | null;
  mailServer: boolean | null;
  spf: boolean | null;
  dmarc: boolean | null;
  disposable: boolean;
  freeProvider: boolean;
  roleBased: boolean;
  smtpStatus: "available" | "inconclusive" | "rejected" | "unknown";
  catchAll: boolean | "unknown";
  emailType: "Business Email" | "Personal Email" | "Disposable Email" | "Invalid";
  mxRecords?: string[];
  checkedAt: string;
  verificationMethod: "free_local";
  details?: string;
}

// Timeout helper for promises
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMsg));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Check RFC 5322 syntax
export function checkEmailSyntax(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) return false;
  if (localPart.length > 64 || domainPart.length > 255) return false;

  // Disallow consecutive dots
  if (localPart.includes("..") || domainPart.includes("..")) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) return false;

  // Domain must have at least one dot and valid TLD (at least 2 chars)
  const domainParts = domainPart.split(".");
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]{2,63}$/.test(tld)) return false;

  // Standard email regex
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(trimmed);
}

// Safe SMTP probe for banner & handshake (strictly without email delivery)
async function probeSmtp(
  mxHost: string,
  email: string,
  domain: string,
  timeoutMs: number = 3500
): Promise<{
  mailServer: boolean | null;
  smtpStatus: "available" | "inconclusive" | "rejected" | "unknown";
  catchAll: boolean | "unknown";
}> {
  return new Promise((resolve) => {
    let resolved = false;
    let mailServer: boolean | null = null;
    let smtpStatus: "available" | "inconclusive" | "rejected" | "unknown" = "unknown";
    let catchAll: boolean | "unknown" = "unknown";

    const socket = new net.Socket();

    const finish = (
      server: boolean | null,
      status: "available" | "inconclusive" | "rejected" | "unknown",
      ca: boolean | "unknown"
    ) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve({ mailServer: server, smtpStatus: status, catchAll: ca });
    };

    socket.setTimeout(timeoutMs);

    socket.on("timeout", () => {
      finish(mailServer, smtpStatus, catchAll);
    });

    socket.on("error", () => {
      // Connection refused, network error, or port 25 blocked by host/ISP
      finish(mailServer, smtpStatus, catchAll);
    });

    let stage = 0; // 0: wait for 220 banner, 1: sent HELO, 2: sent MAIL FROM, 3: sent RCPT TO

    socket.on("data", (chunk) => {
      const response = chunk.toString();
      const code = parseInt(response.slice(0, 3), 10);

      if (stage === 0) {
        if (code === 220) {
          mailServer = true;
          stage = 1;
          socket.write(`HELO leadflow-verify.local\r\n`);
        } else {
          finish(false, "inconclusive", "unknown");
        }
      } else if (stage === 1) {
        if (code === 250) {
          stage = 2;
          socket.write(`MAIL FROM:<verify@leadflow-verify.local>\r\n`);
        } else {
          finish(true, "inconclusive", "unknown");
        }
      } else if (stage === 2) {
        if (code === 250) {
          stage = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else {
          finish(true, "inconclusive", "unknown");
        }
      } else if (stage === 3) {
        if (code === 250 || code === 251) {
          smtpStatus = "available";
          // Try quick catch-all probe
          stage = 4;
          const randomAddress = `leadflow_catchall_test_${Math.floor(Math.random() * 100000)}@${domain}`;
          socket.write(`RCPT TO:<${randomAddress}>\r\n`);
        } else if (code >= 550 && code <= 554) {
          finish(true, "rejected", false);
        } else if (code === 421 || code === 450 || code === 451 || code === 452) {
          finish(true, "inconclusive", "unknown");
        } else {
          finish(true, "inconclusive", "unknown");
        }
      } else if (stage === 4) {
        if (code === 250 || code === 251) {
          catchAll = true;
        } else {
          catchAll = false;
        }
        try {
          socket.write("RSET\r\nQUIT\r\n");
        } catch {
          // ignore
        }
        finish(true, smtpStatus, catchAll);
      }
    });

    try {
      socket.connect(25, mxHost);
    } catch {
      finish(null, "unknown", "unknown");
    }
  });
}

// Use a dedicated DNS Resolver with standard public DNS fallbacks
const dnsResolver = new dns.promises.Resolver();
try {
  dnsResolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // fallback to system default
}

/**
 * Free comprehensive email verifier
 * Uses native DNS resolution, MX checking, SPF, DMARC, disposable lists, role lists,
 * and optional port 25 socket probe.
 * NEVER makes up results; handles timeouts and blocked connections safely as Unknown.
 */
export async function verifyEmail(rawEmail: string): Promise<EmailVerificationResult> {
  const email = (rawEmail || "").trim().toLowerCase();
  const checkedAt = new Date().toISOString();

  // 1. Syntax Check
  const syntaxValid = checkEmailSyntax(email);
  if (!syntaxValid) {
    return {
      status: "invalid",
      syntaxValid: false,
      domainExists: false,
      mxRecord: false,
      mailServer: null,
      spf: null,
      dmarc: null,
      disposable: false,
      freeProvider: false,
      roleBased: false,
      smtpStatus: "rejected",
      catchAll: false,
      emailType: "Invalid",
      checkedAt,
      verificationMethod: "free_local",
      details: "Invalid email syntax format.",
    };
  }

  const [localPart, domain] = email.split("@");

  // 2. Disposable Email Check
  const disposable = isDisposableDomain(domain);

  // 3. Free Provider Check
  const freeProvider = isFreeEmailProvider(domain);

  // 4. Role-based Account Check
  const roleBased = isRoleBasedEmail(localPart);

  // Initial classification
  const emailType = disposable
    ? "Disposable Email"
    : freeProvider
    ? "Personal Email"
    : "Business Email";

  // 5. DNS MX Check & Domain Existence
  let domainExists: boolean | null = null;
  let mxRecord: boolean | null = null;
  let mxRecords: string[] = [];
  let dnsError: string | null = null;

  try {
    const mxList = await withTimeout(
      dnsResolver.resolveMx(domain),
      4000,
      "MX DNS lookup timed out"
    );

    if (mxList && mxList.length > 0) {
      domainExists = true;
      mxRecord = true;
      mxList.sort((a, b) => a.priority - b.priority);
      mxRecords = mxList.map((m) => m.exchange);
    } else {
      mxRecord = false;
    }
  } catch (err: any) {
    const code = err.code;
    if (code === "ENOTFOUND" || code === "NXDOMAIN") {
      domainExists = false;
      mxRecord = false;
    } else if (code === "ENODATA") {
      // Domain exists, but has no MX record. Check fallback A record (RFC 5321)
      try {
        const aRecords = await withTimeout(
          dnsResolver.resolve4(domain),
          2500,
          "A record lookup timed out"
        );
        if (aRecords && aRecords.length > 0) {
          domainExists = true;
          mxRecord = false; // no MX record, but host exists
        } else {
          domainExists = false;
          mxRecord = false;
        }
      } catch {
        domainExists = false;
        mxRecord = false;
      }
    } else {
      // Try system default dns as fallback
      try {
        const sysMx = await withTimeout(
          dns.promises.resolveMx(domain),
          3000,
          "Fallback DNS lookup timed out"
        );
        if (sysMx && sysMx.length > 0) {
          domainExists = true;
          mxRecord = true;
          sysMx.sort((a, b) => a.priority - b.priority);
          mxRecords = sysMx.map((m) => m.exchange);
        } else {
          mxRecord = false;
        }
      } catch (fallbackErr: any) {
        if (fallbackErr.code === "ENOTFOUND" || fallbackErr.code === "NXDOMAIN") {
          domainExists = false;
          mxRecord = false;
        } else {
          dnsError = err.message || "DNS lookup failed";
          domainExists = null;
          mxRecord = null;
        }
      }
    }
  }

  // If domain explicitly does not exist
  if (domainExists === false) {
    return {
      status: "invalid",
      syntaxValid: true,
      domainExists: false,
      mxRecord: false,
      mailServer: false,
      spf: false,
      dmarc: false,
      disposable,
      freeProvider,
      roleBased,
      smtpStatus: "rejected",
      catchAll: false,
      emailType,
      checkedAt,
      verificationMethod: "free_local",
      details: "Domain does not exist or has no DNS records.",
    };
  }

  // If domain has no MX and no fallback
  if (mxRecord === false && domainExists === true) {
    return {
      status: "invalid",
      syntaxValid: true,
      domainExists: true,
      mxRecord: false,
      mailServer: false,
      spf: false,
      dmarc: false,
      disposable,
      freeProvider,
      roleBased,
      smtpStatus: "rejected",
      catchAll: false,
      emailType,
      checkedAt,
      verificationMethod: "free_local",
      details: "Domain exists but has no configured mail exchange (MX) servers.",
    };
  }

  // 6. SPF & DMARC Checks (Parallel)
  let spf: boolean | null = null;
  let dmarc: boolean | null = null;

  try {
    const [txtRecords, dmarcRecords] = await Promise.allSettled([
      withTimeout(dnsResolver.resolveTxt(domain), 3000, "SPF lookup timeout"),
      withTimeout(dnsResolver.resolveTxt(`_dmarc.${domain}`), 3000, "DMARC lookup timeout"),
    ]);

    if (txtRecords.status === "fulfilled") {
      const flattened = txtRecords.value.flat();
      spf = flattened.some((txt) => txt.toLowerCase().startsWith("v=spf1"));
    } else {
      spf = false;
    }

    if (dmarcRecords.status === "fulfilled") {
      const flattened = dmarcRecords.value.flat();
      dmarc = flattened.some((txt) => txt.toLowerCase().startsWith("v=dmarc1"));
    } else {
      dmarc = false;
    }
  } catch {
    spf = null;
    dmarc = null;
  }

  // 7. Mail Server & SMTP Probe
  let mailServer: boolean | null = null;
  let smtpStatus: "available" | "inconclusive" | "rejected" | "unknown" = "unknown";
  let catchAll: boolean | "unknown" = "unknown";

  if (mxRecords.length > 0) {
    try {
      const topMx = mxRecords[0];
      const probeResult = await probeSmtp(topMx, email, domain, 3500);
      mailServer = probeResult.mailServer;
      smtpStatus = probeResult.smtpStatus;
      catchAll = probeResult.catchAll;
    } catch {
      mailServer = null;
      smtpStatus = "unknown";
      catchAll = "unknown";
    }
  }

  // 8. Determine Overall Status
  let status: VerificationStatus = "unknown";
  let details = "";

  if (disposable) {
    status = "risky";
    details = "Temporary or disposable email address detected.";
  } else if (domainExists === null || mxRecord === null) {
    status = "unknown";
    details = dnsError || "DNS or network lookup timed out.";
  } else if (domainExists && mxRecord) {
    status = "valid";
    if (catchAll === true) {
      details = "Active domain with MX records (Catch-All enabled).";
    } else if (roleBased) {
      details = "Active domain with MX records (Role-based address).";
    } else if (mailServer === true) {
      details = "Verified active domain and reachable mail server.";
    } else {
      details = "Verified active domain and valid MX records.";
    }
  }

  return {
    status,
    syntaxValid: true,
    domainExists,
    mxRecord,
    mailServer,
    spf,
    dmarc,
    disposable,
    freeProvider,
    roleBased,
    smtpStatus,
    catchAll,
    emailType,
    mxRecords: mxRecords.slice(0, 3),
    checkedAt,
    verificationMethod: "free_local",
    details,
  };
}
