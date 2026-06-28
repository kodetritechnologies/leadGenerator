import Lead from '../models/Lead.js';
import LeadAnalysis from '../models/LeadAnalysis.js';
import Email from '../models/Email.js';
import Proposal from '../models/Proposal.js';
import Activity from '../models/Activity.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Business from '../models/Business.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import * as geminiService from '../services/gemini.service.js';
import * as placesService from '../services/places.service.js';
import { sendEmail } from '../utils/mailer.js';

// Credit Costs
const CREDITS_AUDIT = 5;
const CREDITS_EMAIL = 2;
const CREDITS_PROPOSAL = 5;
const CREDITS_CHAT = 1;

const verifyAndDeductCredits = async (userId, cost) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, aiCredits: { $gte: cost } },
    { $inc: { aiCredits: -cost } },
    { new: true }
  );
  return user;
};

const refundCredits = async (userId, cost) => {
  await User.findByIdAndUpdate(userId, { $inc: { aiCredits: cost } });
};

export const analyzeWebsite = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Atomically check and deduct credits first
    const user = await verifyAndDeductCredits(req.user.id, CREDITS_AUDIT);
    if (!user) {
      return res.status(402).json({ success: false, message: 'Insufficient AI credits. Upgrade your subscription.' });
    }

    const lead = await Lead.findById(leadId).populate('business');
    if (!lead) {
      await refundCredits(req.user.id, CREDITS_AUDIT);
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const websiteUrl = lead.business.website || '';
    
    let analysisResult;
    try {
      // Call Gemini Service
      analysisResult = await geminiService.analyzeWebsiteOpportunity(websiteUrl, lead.business);
    } catch (aiErr) {
      await refundCredits(req.user.id, CREDITS_AUDIT);
      throw aiErr;
    }

    // Save or update analysis
    let analysis = await LeadAnalysis.findOne({ lead: leadId });
    if (!analysis) {
      analysis = new LeadAnalysis({ lead: leadId, ...analysisResult });
    } else {
      Object.assign(analysis, analysisResult, { analyzedAt: new Date() });
    }
    await analysis.save();

    // Update opportunity score on the Lead model
    lead.opportunityScore = analysisResult.opportunityScore;
    await lead.save();

    // Log Activity
    await Activity.create({
      lead: lead._id,
      user: req.user._id,
      type: 'proposal_generated', // Technical assessment
      description: `Ran AI Website Audit (Score: ${analysisResult.opportunityScore}/100)`,
    });

    res.status(200).json({
      success: true,
      data: {
        analysis,
        creditsRemaining: user.aiCredits
      }
    });
  } catch (error) {
    logger.error(`analyzeWebsite controller error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const generateEmail = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { type, customPoints } = req.body; // e.g. cold_email, follow_up

    const user = await verifyAndDeductCredits(req.user.id, CREDITS_EMAIL);
    if (!user) {
      return res.status(402).json({ success: false, message: 'Insufficient AI credits.' });
    }

    const lead = await Lead.findById(leadId).populate('business');
    if (!lead) {
      await refundCredits(req.user.id, CREDITS_EMAIL);
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    let emailData;
    try {
      emailData = await geminiService.generateOutreachEmail(type, lead.business, customPoints);
    } catch (aiErr) {
      await refundCredits(req.user.id, CREDITS_EMAIL);
      throw aiErr;
    }

    // Save Email Draft in Database
    const emailRecord = await Email.create({
      lead: leadId,
      sender: user._id,
      recipientEmail: lead.business.email || 'hello@business.com',
      subject: emailData.subject,
      body: emailData.body,
      html: emailData.html,
      type,
      status: 'draft',
    });

    res.status(200).json({
      success: true,
      data: {
        email: emailRecord,
        creditsRemaining: user.aiCredits
      }
    });
  } catch (error) {
    logger.error(`generateEmail controller error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const generateLeadProposal = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { pricingAmount, paymentTerms } = req.body;

    const user = await verifyAndDeductCredits(req.user.id, CREDITS_PROPOSAL);
    if (!user) {
      return res.status(402).json({ success: false, message: 'Insufficient AI credits.' });
    }

    const lead = await Lead.findById(leadId).populate('business');
    if (!lead) {
      await refundCredits(req.user.id, CREDITS_PROPOSAL);
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const analysis = await LeadAnalysis.findOne({ lead: leadId });
    if (!analysis) {
      await refundCredits(req.user.id, CREDITS_PROPOSAL);
      return res.status(400).json({ success: false, message: 'Please run website analysis before generating a proposal' });
    }

    let proposalData;
    try {
      proposalData = await geminiService.generateProposal(lead.business, analysis, {
        amount: pricingAmount,
        paymentTerms
      });
    } catch (aiErr) {
      await refundCredits(req.user.id, CREDITS_PROPOSAL);
      throw aiErr;
    }

    // Save proposal
    const proposal = await Proposal.create({
      lead: leadId,
      generatedBy: user._id,
      ...proposalData,
      status: 'draft'
    });

    // Log Activity
    await Activity.create({
      lead: lead._id,
      user: req.user._id,
      type: 'proposal_generated',
      description: `Generated AI Website Proposal: "${proposal.title}"`,
    });

    res.status(200).json({
      success: true,
      data: {
        proposal,
        creditsRemaining: user.aiCredits
      }
    });
  } catch (error) {
    logger.error(`generateProposal controller error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const user = await verifyAndDeductCredits(req.user.id, CREDITS_CHAT);
    if (!user) {
      return res.status(402).json({ success: false, message: 'Insufficient AI credits.' });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: user._id });
      if (!chat) {
        await refundCredits(req.user.id, CREDITS_CHAT);
        return res.status(404).json({ success: false, message: 'Chat thread not found' });
      }
    } else {
      chat = await Chat.create({ user: user._id, title: message.slice(0, 40) + '...' });
    }

    // Retrieve previous messages
    const history = await Message.find({ chat: chat._id }).sort({ createdAt: 1 });

    // Fetch all business context to search from
    const availableBusinesses = await Business.find({ city: { $in: ['Mumbai', 'Delhi', 'Jaipur', 'Indore', 'Pune', 'Goa', 'Bangalore'] } });

    // 1. Detect if this is a lead search intent and extract query/city
    const intent = await geminiService.extractSearchIntent(message);
    let realGoogleLeads = [];
    let googleSearchAttempted = false;
    let googleSearchError = null;

    if (intent.isSearchRequest && intent.searchQuery && intent.city) {
      googleSearchAttempted = true;
      try {
        // 2. Fetch genuine business data from Google Places API
        const fetchedLeads = await placesService.fetchRealLeadsFromGoogle(intent.searchQuery, intent.city);
        
        if (fetchedLeads && fetchedLeads.length > 0) {
          for (const item of fetchedLeads) {
            try {
              // 3. Save or update Business record (de-duplicating by googlePlaceId)
              let business = await Business.findOne({ googlePlaceId: item.googlePlaceId });
              if (!business) {
                business = await Business.create(item);
              }

              // 4. Create Lead linked to user's team
              let lead = await Lead.findOne({ business: business._id, team: user.teamId });
              if (!lead) {
                const isMissingWebsite = !business.website || business.website === 'none';
                lead = await Lead.create({
                  business: business._id,
                  team: user.teamId,
                  status: 'new',
                  opportunityScore: isMissingWebsite ? 95 : Math.floor(Math.random() * 45) + 40,
                  tags: isMissingWebsite ? ['Missing Website', 'Cold Pitch'] : ['Has Site', 'SEO Audit Needed']
                });
                logger.info(`Google Places dynamically ingested real lead: ${business.name} in ${business.city}`);
              }
              
              // Map the DB lead ID and details into a format for the AI prompt
              const leadObj = lead.toObject();
              leadObj.name = business.name;
              leadObj.website = business.website;
              leadObj.phone = business.phone;
              leadObj.address = business.address;
              leadObj.city = business.city;
              leadObj.rating = business.rating;
              leadObj.userRatingsTotal = business.userRatingsTotal;
              leadObj.businessSize = business.businessSize;
              
              realGoogleLeads.push(leadObj);
            } catch (dbErr) {
              logger.error(`Error saving real lead from Google Places: ${dbErr.message}`);
            }
          }
        } else {
          if (!process.env.GOOGLE_MAP_API_KEY) {
            googleSearchError = 'Google Maps API Key is missing in backend environment configuration.';
          } else {
            googleSearchError = 'Google Places API returned no results for the search query and city.';
          }
        }
      } catch (err) {
        logger.error(`Places search failed: ${err.message}`);
        googleSearchError = err.message;
      }
    }

    let aiResponse;
    try {
      // Call Gemini, passing in the genuine leads fetched from Google Places (if any)
      aiResponse = await geminiService.handleAIChatQuery(message, history, availableBusinesses, realGoogleLeads, googleSearchAttempted, googleSearchError);
    } catch (aiErr) {
      await refundCredits(req.user.id, CREDITS_CHAT);
      throw aiErr;
    }

    // Save newly discovered leads into the database (FALLBACK ONLY for mock leads if no real leads were found AND no search attempt failed)
    if (!googleSearchAttempted && (!realGoogleLeads || realGoogleLeads.length === 0) && aiResponse.newLeads && aiResponse.newLeads.length > 0) {
      for (const item of aiResponse.newLeads) {
        try {
          // 1. Create Business record
          const business = await Business.create({
            name: item.name,
            website: item.website === 'none' ? '' : (item.website || ''),
            email: item.email || '',
            phone: item.phone || '',
            address: item.address || '',
            city: item.city,
            state: item.state || '',
            country: item.country || 'India',
            industry: item.industry,
            rating: item.rating ? Number(item.rating) : 0,
            userRatingsTotal: item.userRatingsTotal ? Number(item.userRatingsTotal) : 0,
            businessSize: item.businessSize || 'medium',
            googleMapsUrl: item.googleMapsUrl || undefined
          });

          // 2. Create Lead record linked to the user's team
          const isMissingWebsite = !business.website || business.website === 'none';
          const lead = await Lead.create({
            business: business._id,
            team: user.teamId,
            status: 'new',
            opportunityScore: isMissingWebsite ? 95 : Math.floor(Math.random() * 45) + 40,
            tags: isMissingWebsite ? ['Missing Website', 'Cold Pitch'] : ['Has Site', 'SEO Audit Needed']
          });

          // 3. Add the newly created lead to suggested leads list
          if (!aiResponse.suggestedLeads) {
            aiResponse.suggestedLeads = [];
          }
          aiResponse.suggestedLeads.push(lead._id.toString());
          logger.info(`AI Co-pilot dynamically ingested simulated lead: ${business.name} in ${business.city}`);
        } catch (dbErr) {
          logger.error(`Error saving simulated lead to DB: ${dbErr.message}`);
        }
      }
    }

    // If real leads were fetched, make sure their IDs are recommended in suggestedLeads
    if (realGoogleLeads && realGoogleLeads.length > 0) {
      if (!aiResponse.suggestedLeads) {
        aiResponse.suggestedLeads = [];
      }
      realGoogleLeads.forEach(l => {
        if (!aiResponse.suggestedLeads.includes(l._id.toString())) {
          aiResponse.suggestedLeads.push(l._id.toString());
        }
      });
    }

    // Save user's question
    const userMessage = await Message.create({
      chat: chat._id,
      role: 'user',
      content: message
    });

    // Save assistant's answer
    const assistantMessage = await Message.create({
      chat: chat._id,
      role: 'assistant',
      content: aiResponse.content,
      suggestedLeads: aiResponse.suggestedLeads
    });

    // Update Chat modified timestamp
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      success: true,
      data: {
        chatId: chat._id,
        userMessage,
        assistantMessage,
        creditsRemaining: user.aiCredits
      }
    });
  } catch (error) {
    logger.error(`chatWithAI controller error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: { chats } });
  } catch (error) {
    logger.error(`getChats error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: { messages } });
  } catch (error) {
    logger.error(`getChatMessages error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const sendDirectEmail = async (req, res) => {
  try {
    const { emailId, leadId, recipientEmail, subject, body } = req.body;
    const user = await User.findById(req.user.id);

    if (!recipientEmail || !subject || !body) {
      return res.status(400).json({ success: false, message: 'Recipient email, subject, and body are required' });
    }

    const html = geminiService.formatEmailHtml(subject, body);

    // Send direct email via SMTP
    await sendEmail({
      to: recipientEmail,
      subject,
      text: body,
      html,
    });

    let emailRecord;
    if (emailId) {
      emailRecord = await Email.findById(emailId);
      if (emailRecord) {
        emailRecord.recipientEmail = recipientEmail;
        emailRecord.subject = subject;
        emailRecord.body = body;
        emailRecord.html = html;
        emailRecord.status = 'sent';
        emailRecord.sentAt = new Date();
        await emailRecord.save();
      }
    }

    if (!emailRecord) {
      emailRecord = await Email.create({
        lead: leadId,
        sender: user._id,
        recipientEmail,
        subject,
        body,
        html,
        status: 'sent',
        sentAt: new Date(),
      });
    }

    // Log CRM Activity
    await Activity.create({
      lead: emailRecord.lead,
      user: req.user._id,
      type: 'email_sent',
      description: `Sent direct email to ${recipientEmail}: "${subject}"`,
    });

    res.status(200).json({
      success: true,
      data: {
        email: emailRecord
      }
    });
  } catch (error) {
    logger.error(`sendDirectEmail controller error: ${error.message}`);
    
    // If failed, update email draft status to failed
    try {
      const { emailId } = req.body;
      if (emailId) {
        const emailRecord = await Email.findById(emailId);
        if (emailRecord) {
          emailRecord.status = 'failed';
          await emailRecord.save();
        }
      }
    } catch (saveErr) {
      logger.error(`Failed to update status on email error: ${saveErr.message}`);
    }

    res.status(500).json({ success: false, message: `Failed to send email: ${error.message}` });
  }
};

export const generateWhatsAppMsg = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { type, customPoints } = req.body;

    const user = await verifyAndDeductCredits(req.user.id, 1);
    if (!user) {
      return res.status(402).json({ success: false, message: 'Insufficient AI credits.' });
    }

    const lead = await Lead.findById(leadId).populate('business');
    if (!lead) {
      await refundCredits(req.user.id, 1);
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    let pitchData;
    try {
      pitchData = await geminiService.generateWhatsAppPitch(type, lead.business, customPoints);
    } catch (aiErr) {
      await refundCredits(req.user.id, 1);
      throw aiErr;
    }

    res.status(200).json({
      success: true,
      data: {
        message: pitchData.message,
        creditsRemaining: user.aiCredits
      }
    });
  } catch (error) {
    logger.error(`generateWhatsAppMsg controller error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logWhatsAppActivity = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { message } = req.body;

    const lead = await Lead.findById(leadId).populate('business');
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Log Activity
    await Activity.create({
      lead: leadId,
      user: req.user._id,
      type: 'whatsapp_sent',
      description: `Opened WhatsApp Chat with ${lead.business.name} (${lead.business.phone || 'N/A'})`,
      metadata: { message }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`logWhatsAppActivity error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
