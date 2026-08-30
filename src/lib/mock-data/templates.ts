import { MessageTemplate } from "../types";

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-no-website",
    name: "No Website",
    category: "Web Development",
    subject: "Quick question regarding {business_name}'s web presence",
    channels: ["email", "whatsapp", "linkedin", "instagram", "facebook", "twitter"],
    body: `Hi {ceo_name},

I came across {business_name} while searching for top-rated {niche} in {city}, and I was really impressed by your stellar customer reviews!

I noticed that you don't currently have a dedicated website for {business_name}. In {location}, having a modern, fast mobile website could easily bring you 15-25 new inbound clients every single month who search for {niche} on Google.

We recently built a simple, high-converting website for a similar business that doubled their direct bookings in 30 days.

Would you be open to a 5-minute preview of a mock design I drafted specifically for {business_name}?

Best regards,
{sender_name}
{agency_name}`,
  },
  {
    id: "tpl-redesign",
    name: "Website Redesign",
    category: "Web Design & UX",
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
  {
    id: "tpl-seo",
    name: "SEO Improvement",
    category: "SEO & Traffic",
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
  {
    id: "tpl-booking",
    name: "Booking System",
    category: "Automation & Tools",
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
  {
    id: "tpl-custom-web",
    name: "Custom Website",
    category: "High-Ticket Web",
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
  {
    id: "tpl-mobile-app",
    name: "Mobile App",
    category: "Mobile Solutions",
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
  {
    id: "tpl-general-intro",
    name: "General Introduction",
    category: "Outreach & Networking",
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
];
