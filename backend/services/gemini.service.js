import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

// Setup Gemini Client lazily
let genAI = null;

const getGenAI = () => {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      logger.info('Gemini AI Service initialized successfully.');
      return genAI;
    } catch (err) {
      logger.error(`Error initializing Gemini AI: ${err.message}`);
    }
  }
  return null;
};

// Helper to check if API is active
const isAIActive = () => !!process.env.GEMINI_API_KEY;

/**
 * AI Website Audit & Analysis
 */
export const analyzeWebsiteOpportunity = async (websiteUrl, business) => {
  const ai = getGenAI();
  if (!ai) {
    logger.warn(`GEMINI_API_KEY missing. Generating high-quality mock audit for: ${websiteUrl}`);
    return mockWebsiteAnalysis(websiteUrl, business);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash', responseMimeType: 'application/json' });
    const prompt = `
      You are an expert website inspector and digital marketer. 
      Analyze the business "${business.name}" in city "${business.city}" with website "${websiteUrl}".
      Industry: ${business.industry}. Rating: ${business.rating}. Review count: ${business.userRatingsTotal}.
      
      Generate a detailed technical and marketing audit of this website. You must respond in a valid JSON object matching this schema:
      {
        "websiteExists": true,
        "mobileResponsive": false,
        "loadingSpeed": "string (e.g. 3.4s, 1.2s)",
        "sslCertificate": false,
        "seoScore": 0-100,
        "accessibilityScore": 0-100,
        "performanceScore": 0-100,
        "brokenLinksCount": 0-20,
        "uiDesignQuality": "Poor" | "Average" | "Good",
        "contactFormExists": false,
        "bookingSystemExists": false,
        "socialLinksExists": false,
        "googleMapsLinked": false,
        "technologyUsed": ["WordPress", "PHP", etc],
        "websiteAge": "string (e.g. 8 years, 3 years)",
        "opportunityScore": 0-100 (where 100 means massive potential for selling redesign/SEO, i.e., website is poor or missing),
        "reasons": ["Reason 1", "Reason 2", "Reason 3"],
        "suggestions": "Markdown string containing action steps for a sales agency to pitch."
      }
      Be realistic and tailor it to the input details. For instance, if rating is high but site is missing or poor, opportunity is high.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    logger.error(`Error in Gemini website analysis: ${error.message}`);
    return mockWebsiteAnalysis(websiteUrl, business);
  }
};

/**
 * AI Outreach Email Generator
 */
export const generateOutreachEmail = async (emailType, business, customPoints = '') => {
  const typeMap = {
    cold_email: 'Cold Outreach Pitching Website Redesign or Creation',
    follow_up: 'Follow-up on a previous outreach',
    proposal_email: 'Sending a formal project proposal details',
    reminder: 'Gentle reminder about an unsigned project agreement',
    thank_you: 'Thank you note for initial meeting or booking'
  };

  const selectedType = typeMap[emailType] || typeMap.cold_email;

  const ai = getGenAI();
  if (!ai) {
    logger.warn('GEMINI_API_KEY missing. Generating mock email template.');
    return mockEmailResponse(emailType, business, customPoints);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const prompt = `
      You are an expert sales representative for Kodetri Technologies (website: https://www.kodetri.com/), a premier digital agency specializing in custom web development, mobile responsive design, and SEO audits.
      Write a highly personalized, compelling, and short outreach email of type: "${selectedType}".
      
      Target Business details:
      - Name: ${business.name}
      - Industry: ${business.industry}
      - Website: ${business.website || 'No website'}
      - City: ${business.city}
      
      Custom constraints/points to include: ${customPoints}
      
      Formatting:
      Return your response in a clear layout:
      Subject: [Subject Line Here]
      
      Hi ${business.name},
      
      [Body of the email]
      
      Best regards,
      Team Kodetri Technologies
      Website: https://www.kodetri.com/
      
      Outreach Guidelines:
      - If the target business has NO website (e.g. Website is 'No website' or empty), pitch the creation of a brand new website. Focus on establishing online visibility, capturing local search traffic, and converting prospects. Do NOT mention page speeds, mobile loading issues, or auditing an existing site.
      - If the target business HAS a website, pitch a redesign, mobile responsiveness improvement, or speed/SEO audit.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const subjectMatch = text.match(/Subject:\s*(.*)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Outreach: Digital Upgrade for ${business.name}`;
    const body = text.replace(/Subject:\s*(.*)/i, '').trim();
    const html = formatEmailHtml(subject, body);

    return { subject, body, html };
  } catch (error) {
    logger.error(`Error generating AI Email: ${error.message}`);
    const mockRes = mockEmailResponse(emailType, business, customPoints);
    return {
      ...mockRes,
      html: formatEmailHtml(mockRes.subject, mockRes.body)
    };
  }
};

/**
 * AI Proposal Generator
 */
export const generateProposal = async (business, analysis, pricingDetails = {}) => {
  const amount = pricingDetails.amount || 1500;
  const currency = pricingDetails.currency || 'USD';
  const paymentTerms = pricingDetails.paymentTerms || '50% upfront, 50% on completion';

  const ai = getGenAI();
  if (!ai) {
    logger.warn('GEMINI_API_KEY missing. Generating mock project proposal.');
    return mockProposalResponse(business, analysis, amount, currency, paymentTerms);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash', responseMimeType: 'application/json' });
    const prompt = `
      You are an agency account executive representing Kodetri Technologies (website: https://www.kodetri.com/).
      Generate a project proposal for "${business.name}" based on their website audit.
      Key audit points: Opportunity Score ${analysis.opportunityScore}/100.
      Weak points identified: ${analysis.reasons.join(', ')}.
      
      Pricing: ${amount} ${currency}
      Payment Terms: ${paymentTerms}
      
      Respond in a valid JSON format conforming to this structure:
      {
        "title": "string (e.g. Modern Web Development Proposal for Business Name)",
        "introduction": "string (Professional intro setting expectations, clearly prepared by Kodetri Technologies)",
        "projectScope": "string (Details on what is built)",
        "timeline": "string (e.g. 4 Weeks)",
        "features": [
          { "name": "Feature name", "description": "Short explanation" }
        ],
        "techStack": ["React", "Tailwind CSS", "Node.js", etc],
        "pricing": {
          "amount": Number,
          "currency": "USD",
          "paymentTerms": "Terms info"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    logger.error(`Error generating proposal: ${error.message}`);
    return mockProposalResponse(business, analysis, amount, currency, paymentTerms);
  }
};

/**
 * AI Chat Assistant for Lead Searching
 */
export const handleAIChatQuery = async (query, chatHistory = [], availableLeads = []) => {
  const ai = getGenAI();
  if (!ai) {
    logger.warn('GEMINI_API_KEY missing. Handling AI chat using local filtering heuristics.');
    return runMockChatAssistant(query, availableLeads);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const leadsBrief = availableLeads.map(l => ({
      id: l._id,
      name: l.name,
      website: l.website,
      industry: l.industry,
      city: l.city,
      rating: l.rating,
      hasWebsite: !!l.website
    }));

    const conversationContext = chatHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

    const prompt = `
      You are LeadBrain AI Finder, a smart sales co-pilot.
      Your goal is to help the user search, filter, and discover leads.
      
      Here are the leads already existing in the user's local database for context:
      ${JSON.stringify(leadsBrief.slice(0, 30))}
      
      Recent conversation history:
      ${conversationContext}
      
      User Query: "${query}"
      
      Instructions:
      1. Answer the user's question clearly.
      2. If the user is asking to find, search for, or discover leads (e.g., "Find restaurants in Mumbai" or "Search for lawyers in Goa"):
         - Check if any existing leads in the Database Leads Context fit the request, and recommend them.
         - Additionally, generate a list of NEW, high-quality, realistic businesses that match their criteria. These should be businesses that do not exist in the Database Leads Context.
         - Output a JSON array containing these new businesses at the very bottom of your response in the following exact format:
           NEW_LEADS_JSON: [
             {
               "name": "Business Name",
               "website": "http://example.com" (or empty string/none if website is missing),
               "email": "contact@example.com",
               "phone": "+91 99999 99999",
               "address": "Street address, City",
               "city": "City Name",
               "state": "State Name",
               "country": "India",
               "industry": "Industry Name (e.g. Restaurants, Dentists, Hotels)",
               "rating": 4.2 (0 to 5),
               "userRatingsTotal": 120 (number of reviews),
               "businessSize": "small" | "medium" | "large"
             }
           ]
      3. If you want to recommend any existing leads from the Database Leads Context, list their database IDs in the format:
         MATCHED_LEAD_IDS: [comma separated database IDs of matched leads, if any]
      
      Respond in clear, professional markdown.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const idsMatch = responseText.match(/MATCHED_LEAD_IDS:\s*\[(.*?)\]/);
    let suggestedLeads = [];
    if (idsMatch && idsMatch[1]) {
      suggestedLeads = idsMatch[1].split(',').map(id => id.trim().replace(/['"]/g, '')).filter(Boolean);
    }

    const newLeadsMatch = responseText.match(/NEW_LEADS_JSON:\s*(\[[\s\S]*?\])/);
    let newLeads = [];
    if (newLeadsMatch && newLeadsMatch[1]) {
      try {
        newLeads = JSON.parse(newLeadsMatch[1].trim());
      } catch (err) {
        logger.error(`Error parsing NEW_LEADS_JSON from Gemini: ${err.message}`);
      }
    }

    const cleanContent = responseText
      .replace(/MATCHED_LEAD_IDS:\s*\[.*?\]/g, '')
      .replace(/NEW_LEADS_JSON:\s*\[[\s\S]*?\]/g, '')
      .trim();

    return {
      content: cleanContent,
      suggestedLeads,
      newLeads
    };
  } catch (error) {
    logger.error(`Error in AI Chat assistant: ${error.message}`);
    return runMockChatAssistant(query, availableLeads);
  }
};

// ===================== FALLBACK MOCK DATA GENERATORS =====================

function mockWebsiteAnalysis(websiteUrl, business) {
  const scores = {
    seo: Math.floor(Math.random() * 40) + 40,
    accessibility: Math.floor(Math.random() * 35) + 50,
    performance: Math.floor(Math.random() * 50) + 30,
  };
  const exists = websiteUrl ? !websiteUrl.includes('missing') && !websiteUrl.includes('none') : false;
  const oppScore = exists ? Math.floor((300 - (scores.seo + scores.accessibility + scores.performance)) / 3) : 95;

  const reasons = [];
  if (!exists) {
    reasons.push('No website exists. The business is completely invisible online.');
    reasons.push('No custom domain or business email addresses configured.');
    reasons.push('Missed local discovery; competitors are stealing traffic.');
  } else {
    if (scores.seo < 60) reasons.push('Poor SEO score. Missing meta headers and alt attributes.');
    if (scores.performance < 50) reasons.push('Slow loading times (over 4.2 seconds). Highly impacts conversions.');
    if (Math.random() > 0.5) reasons.push('Lacks mobile responsiveness; elements overlap on viewport resize.');
    if (Math.random() > 0.5) reasons.push('SSL Certificate is invalid or expired, raising browser safety alerts.');
    reasons.push('Lacks modern client conversion hooks like an online booking form.');
  }

  return {
    websiteExists: exists,
    mobileResponsive: exists ? Math.random() > 0.4 : false,
    loadingSpeed: exists ? `${(Math.random() * 4 + 1.2).toFixed(1)}s` : 'N/A',
    sslCertificate: exists ? Math.random() > 0.3 : false,
    seoScore: exists ? scores.seo : 0,
    accessibilityScore: exists ? scores.accessibility : 0,
    performanceScore: exists ? scores.performance : 0,
    brokenLinksCount: exists ? Math.floor(Math.random() * 12) : 0,
    uiDesignQuality: exists ? (scores.performance > 70 ? 'Good' : 'Average') : 'Poor',
    contactFormExists: exists ? Math.random() > 0.3 : false,
    bookingSystemExists: false,
    socialLinksExists: exists ? Math.random() > 0.2 : false,
    googleMapsLinked: Math.random() > 0.3,
    technologyUsed: exists ? ['WordPress', 'JQuery', 'MySQL', 'Apache'] : [],
    websiteAge: exists ? `${Math.floor(Math.random() * 8) + 2} years` : 'N/A',
    opportunityScore: oppScore,
    reasons: reasons.slice(0, 4),
    suggestions: exists
      ? `### Recommended Redesign Blueprint for **${business.name}**
1. **Develop modern frontend**: Rebuild the site using React & Tailwind CSS for custom styling, or setup high-converting Webflow templates.
2. **Setup Call-to-Actions (CTAs)**: Build a lead acquisition widget or live booking engine to convert visitors immediately.
3. **Core Web Vitals Boost**: Optimize images and assets to guarantee page load speeds under 1.5s.
4. **Google Business Integration**: Match schema elements to local SEO queries and map rankings.`
      : `### Recommended Web Development Blueprint for **${business.name}**
1. **Build a brand new website**: Establish a professional web presence using React & Tailwind CSS or Webflow.
2. **Setup domain & hosting**: Secure a custom business domain name and setup reliable hosting.
3. **Local SEO setup**: Optimize the new site for local search queries and connect it to Google Maps and Google Business Profile.
4. **Lead capture forms**: Embed customer inquiry forms or contact forms to start collecting client leads.`
  };
}

function mockEmailResponse(type, business, customPoints = '') {
  let subject = '';
  let body = '';
  const hasWebsite = business.website && business.website !== 'none' && business.website !== 'None' && business.website.trim() !== '';
  const hasReviews = business.userRatingsTotal > 0;

  if (type === 'cold_email') {
    if (hasWebsite) {
      subject = `Quick question regarding website upgrades for ${business.name}`;
      const reviewText = hasReviews 
        ? `Your Google page has outstanding reviews (${business.rating} stars!), but I noticed your website has some loading issues on mobile devices.`
        : `I noticed your business is listed on Google, but your website has some loading issues on mobile devices.`;

      body = `Hi ${business.name},

I came across ${business.name} while researching local businesses in ${business.city}. 

${reviewText} In today's market, over 60% of local searches happen on phones, meaning you might be losing valuable leads.

At Kodetri Technologies, we build lightning-fast custom websites that turn visitors into paying clients. I put together a quick mockup audit detailing how we can double your site performance.

Would you be open to a brief, 10-minute call next Tuesday at 2 PM to go over our suggestions?

Best regards,
Team Kodetri Technologies
Website: https://www.kodetri.com/`;
    } else {
      subject = `Website setup inquiry for ${business.name}`;
      const reviewText = hasReviews 
        ? `Your Google page has outstanding reviews (${business.rating} stars!), but I noticed that your business doesn't currently have a website.`
        : `I noticed your business is listed on Google, but it doesn't currently have a website or any reviews yet.`;

      body = `Hi ${business.name},

I came across ${business.name} while researching local businesses in ${business.city}. 

${reviewText} In today's market, over 60% of local customers search online before visiting, meaning you might be losing valuable leads to competitors.

At Kodetri Technologies, we build custom, high-converting websites designed to turn online searches into paying clients. We'd love to help you launch your online presence.

Would you be open to a brief, 10-minute call next Tuesday at 2 PM to go over some mockups we prepared?

Best regards,
Team Kodetri Technologies
Website: https://www.kodetri.com/`;
    }
  } else if (type === 'follow_up') {
    if (hasWebsite) {
      subject = `Re: Digital upgrades for ${business.name}`;
      body = `Hi ${business.name},

I wanted to follow up on my email from last week. I know you're busy running ${business.name}, so I'll keep this short.

We recently helped a business in your industry double their online bookings in under 30 days by redesigning their booking funnel. I'd love to share the framework with you.

Are you available for a quick chat later this week?

Best regards,
Team Kodetri Technologies
Website: https://www.kodetri.com/`;
    } else {
      subject = `Re: Website options for ${business.name}`;
      body = `Hi ${business.name},

I wanted to follow up on my email from last week. I know you're busy running ${business.name}, so I'll keep this short.

We recently helped a local business set up their first web presence, which led to a 40% increase in customer calls in 30 days. We would love to do the same for you.

Are you available for a quick chat later this week?

Best regards,
Team Kodetri Technologies
Website: https://www.kodetri.com/`;
    }
  } else {
    if (hasWebsite) {
      subject = `Digital Proposal Details - ${business.name}`;
      body = `Hi ${business.name},

Please find the digital development proposal attached or linked below. It details the scope, features, timeline, and pricing estimates we discussed.

Looking forward to collaborating with you!

Best regards,
Team Kodetri Technologies
Website: https://www.kodetri.com/`;
    } else {
      subject = `New Website Proposal - ${business.name}`;
      body = `Hi ${business.name},

Please find the digital proposal for building a brand new website for your business attached below. It details the setup, features, timeline, and pricing estimates we discussed.

Looking forward to launching your new website!

Best regards,
Team Kodetri Technologies
Website: https://www.kodetri.com/`;
    }
  }

  if (customPoints) {
    body += `\n\nPS: Regarding your note: "${customPoints}"`;
  }

  return { subject, body };
}

function mockProposalResponse(business, analysis, amount, currency, paymentTerms) {
  return {
    title: `Modern Digital Transformation Proposal for ${business.name}`,
    introduction: `Prepared by Kodetri Technologies for ${business.name}. This proposal details our strategy to upgrade your web presence, optimize conversions, and solve critical site bugs identified in our AI Audit.`,
    projectScope: `Complete design mockups, responsive mobile layouts, SEO semantic schema setup, lightning-fast React deployment, and dynamic contact/booking structures.`,
    timeline: '3 - 4 Weeks',
    features: [
      { name: 'Responsive Layout', description: 'Fluid styles supporting iOS, Android, tablets, and large screen formats.' },
      { name: 'SEO Optimization', description: 'Schema markup, title tags, meta details, and site indexing setups.' },
      { name: 'Client Booking Widget', description: 'Custom inline module letting customers reserve service slots directly.' },
      { name: 'SSL & Secure Config', description: 'Enable secure HTTPS connection protocols to ensure user safety.' }
    ],
    techStack: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion', 'NodeJS'],
    pricing: {
      amount,
      currency,
      paymentTerms
    }
  };
}

function runMockChatAssistant(query, availableLeads) {
  const text = query.toLowerCase();

  // Try to parse city
  let city = 'Pune';
  if (text.includes('mumbai')) city = 'Mumbai';
  else if (text.includes('delhi')) city = 'Delhi';
  else if (text.includes('jaipur')) city = 'Jaipur';
  else if (text.includes('indore')) city = 'Indore';
  else if (text.includes('goa')) city = 'Goa';
  else if (text.includes('bangalore')) city = 'Bangalore';

  // Try to parse industry
  let industry = 'Gyms';
  if (text.includes('restaurant') || text.includes('food') || text.includes('cafe')) industry = 'Restaurants';
  else if (text.includes('dentist') || text.includes('dental') || text.includes('doctor')) industry = 'Dentists';
  else if (text.includes('hotel') || text.includes('stay') || text.includes('resort')) industry = 'Hotels';
  else if (text.includes('real estate') || text.includes('builder') || text.includes('realty')) industry = 'Real Estate';
  else if (text.includes('barber') || text.includes('salon') || text.includes('haircut') || text.includes('parlour')) industry = 'Barber Shops';

  let matchedLeads = [];
  let newLeads = [];

  // If user is searching/finding new leads
  const isSearchQuery = text.includes('find') || text.includes('search') || text.includes('show') || text.includes('get') || text.includes('look for');

  if (isSearchQuery) {
    // Generate 2 new mock leads to simulate finding new ones!
    const names = {
      'Restaurants': [`The Gourmet Garden ${city}`, `Spice Route Bistro ${city}`],
      'Dentists': [`Smile Dental Clinic ${city}`, `Apex Orthodontics ${city}`],
      'Hotels': [`Royal Heritage Inn ${city}`, `Grand View Retreat ${city}`],
      'Real Estate': [`Prime Properties ${city}`, `Apex Realtors ${city}`],
      'Gyms': [`Iron Temple Gym ${city}`, `Pulse Fitness Club ${city}`],
      'Barber Shops': [`Classic Cuts Barber ${city}`, `Style Loft Salon ${city}`]
    };

    const targetNames = names[industry] || [`Elite Business Services ${city}`, `Global Digital Agency ${city}`];

    newLeads = [
      {
        name: targetNames[0],
        website: Math.random() > 0.5 ? `http://${targetNames[0].toLowerCase().replace(/\s+/g, '')}.com` : '',
        email: `info@${targetNames[0].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+91 ${Math.floor(8000000000 + Math.random() * 1999999999)}`,
        address: `101 Commercial St, ${city}`,
        city: city,
        state: city === 'Delhi' ? 'Delhi' : city === 'Mumbai' || city === 'Pune' ? 'Maharashtra' : city === 'Jaipur' ? 'Rajasthan' : 'Goa',
        country: 'India',
        industry: industry,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        userRatingsTotal: Math.floor(Math.random() * 200) + 15,
        businessSize: 'medium'
      },
      {
        name: targetNames[1],
        website: '', // mock missing website for high opportunity
        email: `contact@${targetNames[1].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+91 ${Math.floor(8000000000 + Math.random() * 1999999999)}`,
        address: `202 Ring Road, ${city}`,
        city: city,
        state: city === 'Delhi' ? 'Delhi' : city === 'Mumbai' || city === 'Pune' ? 'Maharashtra' : city === 'Jaipur' ? 'Rajasthan' : 'Goa',
        country: 'India',
        industry: industry,
        rating: parseFloat((3.0 + Math.random() * 1.8).toFixed(1)),
        userRatingsTotal: Math.floor(Math.random() * 90) + 5,
        businessSize: 'small'
      }
    ];

    matchedLeads = availableLeads.filter(l => l.city.toLowerCase() === city.toLowerCase() && l.industry.toLowerCase() === industry.toLowerCase());
  } else {
    // Standard heuristics fallback
    if (text.includes('restaurant') || text.includes('food')) {
      matchedLeads = availableLeads.filter(l => l.industry.toLowerCase().includes('restaurant') || l.industry.toLowerCase().includes('cafe'));
    } else if (text.includes('dentist') || text.includes('dental') || text.includes('doctor')) {
      matchedLeads = availableLeads.filter(l => l.industry.toLowerCase().includes('dentist') || l.industry.toLowerCase().includes('clinic'));
    } else if (text.includes('hotel') || text.includes('stay') || text.includes('resort')) {
      matchedLeads = availableLeads.filter(l => l.industry.toLowerCase().includes('hotel') || l.industry.toLowerCase().includes('resort'));
    } else if (text.includes('barber') || text.includes('salon') || text.includes('haircut') || text.includes('parlour')) {
      matchedLeads = availableLeads.filter(l => l.industry.toLowerCase().includes('barber') || l.industry.toLowerCase().includes('salon'));
    } else if (text.includes('no website') || text.includes('without website') || text.includes('missing')) {
      matchedLeads = availableLeads.filter(l => !l.website);
    } else {
      matchedLeads = availableLeads.slice(0, 3);
    }
  }

  const ids = matchedLeads.map(l => l._id.toString());

  let listMarkdown = '';
  if (isSearchQuery) {
    listMarkdown = `I searched online for new listings in **${city}** and found **${newLeads.length} new leads** for **${industry}**. I've automatically added them to your database:\n\n` +
      newLeads.map(l => `- **${l.name}** (${l.rating}⭐) | Website: ${l.website || '*None (High Opportunity!)*'}`).join('\n');
  } else {
    listMarkdown = matchedLeads.length > 0
      ? `I searched the system database and found **${matchedLeads.length} leads** matching your request:\n\n` +
      matchedLeads.map(l => `- **${l.name}** in ${l.city} (${l.industry}) - Website: ${l.website || 'None'}`).join('\n')
      : `I searched the database but couldn't find any direct matches. Try searching other cities or industries using the sidebar filters!`;
  }

  return {
    content: `### LeadBrain AI Assistant Response\n\n${listMarkdown}\n\nI can help you build custom cold outreach emails, or generate a development proposal for any of these leads. Let me know what you want to do next!`,
    suggestedLeads: ids,
    newLeads: newLeads
  };
}

export function formatEmailHtml(subject, body) {
  const paragraphHtml = body
    .split('\n')
    .map(line => line.trim() ? `<p style="margin-bottom: 16px;">${line}</p>` : '')
    .join('');

  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
    <img src="http://localhost:5000/public/logo.png" alt="Kodetri Technologies" style="height: 50px; width: auto; object-fit: contain; display: block; margin: 0 auto;" />
  </div>
  <!-- Body -->
  <div style="padding: 32px; color: #334155; line-height: 1.6; font-size: 14px;">
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 18px; font-weight: 700;">${subject}</h2>
    ${paragraphHtml}
  </div>
  <!-- Footer -->
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">
    Sent via <strong>Kodetri Technologies</strong> Agency Platform &copy; 2026
  </div>
</div>
  `.trim();
}

/**
 * AI Outreach WhatsApp Pitch Generator
 */
export const generateWhatsAppPitch = async (type, business, customPoints = '') => {
  const typeMap = {
    intro: 'Cold Introduction for Web Redesign',
    follow_up: 'Quick Follow-up check-in',
    proposal: 'Summarizing proposal details'
  };

  const selectedType = typeMap[type] || typeMap.intro;

  const ai = getGenAI();
  if (!ai) {
    logger.warn('GEMINI_API_KEY missing. Generating mock WhatsApp pitch.');
    return mockWhatsAppResponse(type, business, customPoints);
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const prompt = `
      You are an expert sales representative for Kodetri Technologies (website: https://www.kodetri.com/).
      Write a short, engaging, and professional WhatsApp outreach message of type: "${selectedType}" for:
      Business Name: ${business.name}
      Industry: ${business.industry}
      Website: ${business.website || 'No website'}
      City: ${business.city}
      Google Rating: ${business.rating || 'No ratings'} (${business.userRatingsTotal || 0} reviews)
      
      Custom constraints/points to include: ${customPoints}
      
      Formatting rules:
      - Keep it under 250 characters (very short and punchy for WhatsApp).
      - Use professional but friendly chat tone with 1-2 appropriate emojis.
      - Do NOT include any email headers or email greetings like "Best regards" or signature blocks. 
      - You can use standard WhatsApp formatting like *bold* for emphasis.
      - Do NOT write basic generic messages like "I would love to connect to discuss website development options." Provide a specific, highly persuasive value proposition tailored to their city and industry (e.g. "We help businesses in *${business.city}* capture more leads").
      - Do NOT offer a "free audit" or "site audit". Instead, invite them to view your portfolio/work or discuss custom designs.
      - Add a friendly, low-friction call to action (e.g. "Got 5 mins for a quick chat?").
      
      Outreach Guidelines:
      - If the target business has NO website (e.g. Website is 'No website' or empty), pitch the creation of a brand new, high-converting website to capture local search traffic. Do NOT mention page speeds, mobile loading issues, or redesigning an existing website.
      - If the target business HAS a website, pitch a redesign, speed boost, or mobile performance optimization to increase conversions.
      - If the target business has 0 Google reviews, do NOT mention their Google rating or outstanding reviews in the message.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return { message: text };
  } catch (error) {
    logger.error(`Error generating AI WhatsApp pitch: ${error.message}`);
    return mockWhatsAppResponse(type, business, customPoints);
  }
};

function mockWhatsAppResponse(type, business, customPoints = '') {
  let message = '';
  const hasWebsite = business.website && business.website !== 'none' && business.website !== 'None' && business.website.trim() !== '';

  if (type === 'follow_up') {
    if (hasWebsite) {
      message = `Hi *${business.name}* team, hope you're having a great week! Just wanted to follow up on the website options I emailed. Let me know if you have 5 mins for a quick WhatsApp call?`;
    } else {
      message = `Hi *${business.name}* team, hope you're having a great week! Just wanted to follow up on my note about setting up a website for your business. Let me know if you have 5 mins for a quick chat?`;
    }
  } else if (type === 'proposal') {
    message = `Hi *${business.name}* team, I just sent over our custom web proposal details for your business. I'd love to get your thoughts on it when you have a moment!`;
  } else {
    if (hasWebsite) {
      message = `Hi *${business.name}*, noticed your website could use a speed and SEO boost. We help businesses in *${business.city}* double their leads with modern web redesigns. View our portfolio here: https://www.kodetri.com/`;
    } else {
      message = `Hi *${business.name}*, noticed your business doesn't have a website yet. We help businesses in *${business.city}* get more customers by building modern, high-converting websites. Let me know if we can connect!`;
    }
  }
  if (customPoints) {
    message += ` (${customPoints})`;
  }
  return { message };
}

