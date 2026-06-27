import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger.js';
import * as geminiService from './gemini.service.js';
import Lead from '../models/Lead.js';
import LeadAnalysis from '../models/LeadAnalysis.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisConnection = null;
let auditQueue = null;
let auditWorker = null;

// Initialize Queues
try {
  // Test connection to Redis before spinning up BullMQ
  redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 2000,
    lazyConnect: true // Do not auto connect on creation
  });

  redisConnection.on('error', (err) => {
    logger.warn(`Redis connection failed: ${err.message}. Switching to In-Memory Queue Fallback.`);
    useInMemoryQueue();
  });

  await redisConnection.connect();
  logger.info('Connected to Redis for background jobs.');

  // If connected, setup BullMQ
  auditQueue = new Queue('audit-queue', { connection: redisConnection });
  
  auditWorker = new Worker('audit-queue', async (job) => {
    logger.info(`Processing background website audit for lead: ${job.data.leadId}`);
    await executeWebsiteAuditJob(job.data.leadId);
  }, { connection: redisConnection });

  auditWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  auditWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

} catch (error) {
  logger.warn(`Redis not available: ${error.message}. Switching to In-Memory Queue Fallback.`);
  useInMemoryQueue();
}

function useInMemoryQueue() {
  redisConnection = null;
  auditQueue = {
    add: async (name, data) => {
      logger.info(`InMemory Queue: Queueing job '${name}' for lead: ${data.leadId}`);
      // Simulate asynchronous background job tick
      setTimeout(async () => {
        try {
          await executeWebsiteAuditJob(data.leadId);
          logger.info(`InMemory Queue: Job '${name}' completed successfully`);
        } catch (err) {
          logger.error(`InMemory Queue: Job '${name}' failed: ${err.message}`);
        }
      }, 3000); // 3 seconds delay to simulate background worker
      return { id: `in_memory_${Date.now()}` };
    }
  };
}

async function executeWebsiteAuditJob(leadId) {
  try {
    const lead = await Lead.findById(leadId).populate('business');
    if (!lead) return;

    const result = await geminiService.analyzeWebsiteOpportunity(lead.business.website || '', lead.business);

    let analysis = await LeadAnalysis.findOne({ lead: leadId });
    if (!analysis) {
      analysis = new LeadAnalysis({ lead: leadId, ...result });
    } else {
      Object.assign(analysis, result, { analyzedAt: new Date() });
    }
    await analysis.save();

    lead.opportunityScore = result.opportunityScore;
    await lead.save();
    
    logger.info(`Audit completed in background for lead: ${leadId}`);
  } catch (error) {
    logger.error(`executeWebsiteAuditJob error: ${error.message}`);
    throw error;
  }
}

export const queueWebsiteAudit = async (leadId) => {
  if (auditQueue) {
    return await auditQueue.add('audit-website', { leadId });
  }
};
