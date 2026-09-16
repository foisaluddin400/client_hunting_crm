import { MessageTemplate } from "../types";

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  // 1. No Website - Template 1
  {
    id: "tpl-no-website-1",
    name: "No Website: Quick Mockup Offer",
    category: "No Website",
    subject: "Quick question regarding {business_name}'s web presence",
    channels: ["email", "whatsapp", "linkedin", "instagram", "facebook", "twitter"],
    body: `Hi {ceo_name},

I came across {business_name} while researching top-rated {niche} in {city}, and I was really impressed by your stellar customer reviews!

I noticed that you don't currently have an active website for {business_name}. In {location}, having a modern, fast mobile website could easily bring you 15-25 new inbound clients every month who search for {niche} on Google.

We recently built a simple, high-converting website for a similar business that doubled their direct bookings in 30 days.

Would you be open to a 5-minute preview of a mock design I drafted specifically for {business_name}?

Best regards,
{sender_name}
{agency_name}`,
  },
  // 1. No Website - Template 2
  {
    id: "tpl-no-website-2",
    name: "No Website: Missed Search Leads",
    category: "No Website",
    subject: "Potential customers searching for {niche} in {city}",
    channels: ["email", "whatsapp", "linkedin"],
    body: `Hi {ceo_name},

I noticed {business_name} has outstanding ratings in {location}, but doesn't have an official website listed on Google Maps.

Right now, hundreds of locals are searching for {niche} in {city} every week and ending up with competitors who have dedicated booking and service pages.

We can set up a professional, mobile-friendly website for {business_name} that starts generating calls and inquiries right away.

Can I send over a quick 2-minute overview showing what that would look like?

Cheers,
{sender_name}
{agency_name}`,
  },

  // 2. Website Redesign - Template 1
  {
    id: "tpl-redesign-1",
    name: "Website Redesign: Modern Conversions",
    category: "Website Redesign",
    subject: "Ideas to modernize {business_name}'s website for more conversions",
    channels: ["email", "linkedin", "whatsapp", "facebook", "twitter"],
    body: `Hi {ceo_name},

I was researching established {niche} in {location} and spent some time on your website today.

You guys clearly have a fantastic reputation and strong services, but your current website looks like it hasn't been refreshed in a few years and might be losing mobile visitors due to slow load speed and non-responsive layout.

I put together a quick 3-point breakdown showing how a modernized, high-speed redesign could increase your visitor-to-lead conversion rate by 40%+.

Would you like me to send over the 2-minute video breakdown? No pitch, just actionable ideas for your team.

Cheers,
{sender_name} | {agency_name}`,
  },
  // 2. Website Redesign - Template 2
  {
    id: "tpl-redesign-2",
    name: "Website Redesign: Speed & Mobile UX",
    category: "Website Redesign",
    subject: "Quick feedback on {business_name}'s mobile user experience",
    channels: ["email", "linkedin", "whatsapp"],
    body: `Hello {ceo_name},

I checked out {business_name}'s website on mobile today while looking into {niche} in {city}.

Your customer reputation is incredible, but on mobile devices, key elements like appointment booking and contact details require quite a bit of pinching and scrolling. Over 70% of local searches happen on smartphones, so even small UX bottlenecks cost real customers.

We specialize in transforming older business sites into ultra-fast, modern lead machines.

Would you be interested in seeing a quick before/after concept tailored for {business_name}?

Best,
{sender_name}
{agency_name}`,
  },

  // 3. SEO Improvement - Template 1
  {
    id: "tpl-seo-1",
    name: "SEO Improvement: Local Search Traffic",
    category: "SEO Improvement",
    subject: "Missed Google search traffic for {business_name} in {city}",
    channels: ["email", "linkedin", "twitter"],
    body: `Hi {ceo_name},

Did you know that over 2,400 people search for "{niche} in {city}" every month on Google, but {business_name} is currently ranking on page 2 behind lower-rated competitors?

We conducted a complimentary SEO audit for your site and identified 3 quick technical fixes (including Google Business Profile schema and local keywords) that can push you to the Top 3 local pack within 60 days.

Can I share the 1-page PDF audit report with you?

Best,
{sender_name}
Local SEO Specialist @ {agency_name}`,
  },
  // 3. SEO Improvement - Template 2
  {
    id: "tpl-seo-2",
    name: "SEO Improvement: Competitor Comparison",
    category: "SEO Improvement",
    subject: "Why competitors outrank {business_name} in {city} (and how to fix it)",
    channels: ["email", "linkedin"],
    body: `Hi {ceo_name},

I ran a competitive search analysis on top {niche} across {location}.

While {business_name} has stronger customer feedback, a few key competitors are capturing the bulk of Google organic traffic simply because their technical SEO and location pages are better indexed.

We put together a straightforward blueprint to help you outrank them and claim the #1 local spot.

Would you be open to a quick 5-minute review of the findings this week?

Warm regards,
{sender_name}`,
  },

  // 4. Booking System - Template 1
  {
    id: "tpl-booking-1",
    name: "Booking System: Automated 24/7 Flow",
    category: "Booking System",
    subject: "Automated 24/7 client booking system for {business_name}",
    channels: ["whatsapp", "email", "instagram", "facebook"],
    body: `Hey {ceo_name}! 👋

Hope you're having a productive week at {business_name}.

I noticed potential customers currently have to call or wait for manual replies to schedule appointments with you.

We help busy {niche} in {city} implement seamless 24/7 instant WhatsApp & Web booking flows that send automatic SMS reminders to reduce no-shows by 80%.

Would you be interested in a quick 60-second interactive demo showing how it would work for {business_name}?

Regards,
{sender_name}`,
  },
  // 4. Booking System - Template 2
  {
    id: "tpl-booking-2",
    name: "Booking System: Reduce No-Shows",
    category: "Booking System",
    subject: "Eliminating missed appointments for {business_name}",
    channels: ["email", "whatsapp"],
    body: `Hi {ceo_name},

Managing client bookings manually takes hours each week and often results in costly no-shows.

We build integrated self-scheduling systems tailored for {niche} in {location} that collect deposits upfront and send automated calendar reminders.

Our clients typically see a 35% increase in confirmed bookings in their first month.

Could I share a brief preview with you?

Best,
{sender_name}
{agency_name}`,
  },

  // 5. Custom Website - Template 1
  {
    id: "tpl-custom-web-1",
    name: "Custom Website: Digital Authority",
    category: "Custom Website",
    subject: "Custom digital platform concept for {business_name}",
    channels: ["email", "linkedin"],
    body: `Hello {ceo_name},

I've been following {business_name}'s recent growth in the {niche} space across {location}.

As you scale, having a premium custom digital experience that communicates luxury, reliability, and instant authority is critical to commanding higher retainer and project rates.

Our studio crafts bespoke digital platforms with lightning-fast performance, custom client portals, and seamless lead capture tailored specifically for industry leaders.

Are you available for a brief 10-minute discovery call next Tuesday or Wednesday to explore some initial ideas?

Warm regards,
{sender_name}
Founder, {agency_name}`,
  },
  // 5. Custom Website - Template 2
  {
    id: "tpl-custom-web-2",
    name: "Custom Website: High-Ticket Lead Gen",
    category: "Custom Website",
    subject: "Scaling {business_name} with an enterprise-grade web presence",
    channels: ["email", "linkedin"],
    body: `Hi {ceo_name},

{business_name} stands out as an established market leader in {niche} in {location}.

Standard template websites often fail to capture the prestige and scope of high-end businesses. We design bespoke, tailor-made digital platforms that position companies at the very top of their industry and convert premium clients.

I'd love to share a few concepts we developed for businesses with similar scale to {business_name}.

Do you have 10 minutes for a brief chat sometime this week?

Best regards,
{sender_name} | {agency_name}`,
  },

  // 6. Mobile App - Template 1
  {
    id: "tpl-mobile-app-1",
    name: "Mobile App: Repeat Customer Retention",
    category: "Mobile App",
    subject: "Mobile app concept to increase repeat customer retention for {business_name}",
    channels: ["email", "linkedin", "whatsapp"],
    body: `Hi {ceo_name},

With customer loyalty and mobile commerce growing rapidly in {niche}, having a branded mobile app with direct push notifications can increase repeat bookings by 3x.

We specialize in rapid-deployment native iOS & Android applications for thriving local businesses in {location}.

I have a clickable prototype ready that demonstrates client loyalty rewards, 1-tap ordering, and direct messaging.

Could I send you the interactive link to play around with?

Best,
{sender_name}
{agency_name}`,
  },
  // 6. Mobile App - Template 2
  {
    id: "tpl-mobile-app-2",
    name: "Mobile App: Push Notifications & VIP Club",
    category: "Mobile App",
    subject: "Branded mobile app for {business_name}'s VIP clients",
    channels: ["email", "linkedin"],
    body: `Hello {ceo_name},

Most local {niche} rely solely on social media algorithms to reach their past customers. With a branded mobile app, you have a direct 100% open-rate channel via push notifications right to your clients' phones.

We build custom mobile apps featuring instant scheduling, loyalty cards, and private offers.

Would you be open to seeing a quick 90-second interactive demo for {business_name}?

Best regards,
{sender_name}`,
  },

  // 7. General Introduction - Template 1
  {
    id: "tpl-general-intro-1",
    name: "General Introduction: Collaboration Idea",
    category: "General Introduction",
    subject: "Quick introduction & collaboration idea for {business_name}",
    channels: ["email", "linkedin", "instagram", "facebook", "twitter", "whatsapp"],
    body: `Hi {ceo_name},

I hope this message finds you well!

I'm reaching out because I really admire what you've built with {business_name} in {location}. We work with top-tier {niche} to streamline their client acquisition and upgrade their online brand authority.

We have a few proven case studies in your niche where we generated $45k+ in pipeline value within the first quarter.

Would you be open to connecting and having a quick casual chat sometime this week?

Best regards,
{sender_name}
{agency_name}`,
  },
  // 7. General Introduction - Template 2
  {
    id: "tpl-general-intro-2",
    name: "General Introduction: Direct Pitch",
    category: "General Introduction",
    subject: "Growth partnership with {business_name}",
    channels: ["email", "linkedin"],
    body: `Hi {ceo_name},

I came across {business_name} while researching top {niche} companies in {city}.

Our agency helps local businesses scale their online client acquisition through optimized digital funnels and conversion-focused design.

Given your strong local presence in {location}, I think there is a significant opportunity to double your inbound digital inquiries this quarter.

Would you be open to a 5-minute call next week to see if we'd be a good fit to work together?

Cheers,
{sender_name}
{agency_name}`,
  },

  // 8. Follow-up Outreach Templates - Template 1
  {
    id: "tpl-followup-1",
    name: "Follow-up #1: Friendly Check-in",
    category: "Follow-up",
    subject: "Following up regarding {business_name}",
    channels: ["email", "whatsapp", "linkedin"],
    body: `Hi {ceo_name},

I wanted to quickly follow up on my previous message regarding {business_name}.

I know you're busy running things in {city}, so I just wanted to make sure my note didn't get buried in your inbox.

Whenever you have 2 minutes, I'd love to share the ideas I drafted for your team.

Best regards,
{sender_name}
{agency_name}`,
  },
  // 8. Follow-up Outreach Templates - Template 2
  {
    id: "tpl-followup-2",
    name: "Follow-up #2: Added Value & Insight",
    category: "Follow-up",
    subject: "Quick insight for {business_name}'s digital strategy",
    channels: ["email", "whatsapp", "linkedin"],
    body: `Hi {ceo_name},

Following up on my last note. I was reviewing recent trends for {niche} in {location} and thought of another quick idea that could help {business_name} capture more high-value inquiries this month.

I put together a short 2-minute summary with actionable recommendations for your team.

Would you like me to send it over? No obligations at all.

Cheers,
{sender_name} | {agency_name}`,
  },
  // 8. Follow-up Outreach Templates - Template 3
  {
    id: "tpl-followup-3",
    name: "Follow-up #3: Final Check-in",
    category: "Follow-up",
    subject: "Closing the loop on {business_name}",
    channels: ["email", "whatsapp", "linkedin"],
    body: `Hi {ceo_name},

I haven't heard back, so I assume improving {business_name}'s online client acquisition isn't a priority right now, which is completely understandable!

I'll close the loop for now so I don't clutter your inbox. If you ever want to explore modernizing your digital presence or boosting bookings down the road, feel free to reach out anytime.

Wishing you and {business_name} continued success!

Warm regards,
{sender_name}
{agency_name}`,
  },
];
