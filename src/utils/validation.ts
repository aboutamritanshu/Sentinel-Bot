import Joi from 'joi';

export const serverConfigSchema = Joi.object({
  warningThreshold: Joi.number().min(0).max(100).default(10),
  timeoutThreshold: Joi.number().min(0).max(100).default(25),
  banThreshold: Joi.number().min(0).max(100).default(50),
  wordScoringConfig: Joi.object().pattern(Joi.string(), Joi.number().min(0)).default({}),
  escalationConfig: Joi.object().default({})
});

export const reportSchema = Joi.object({
  reporterId: Joi.string().required(),
  reportedUserId: Joi.string().required(),
  reason: Joi.string().optional()
});

export const ticketSchema = Joi.object({
  creatorId: Joi.string().required(),
  category: Joi.string().required(),
  description: Joi.string().optional()
});

export const aiModerationResponseSchema = Joi.object({
  category: Joi.string().valid('toxic', 'harassment', 'hate', 'spam', 'safe').required(),
  severity: Joi.number().min(0).max(10).required(),
  confidence: Joi.number().min(0).max(1).required()
});

export const aiDisputeResponseSchema = Joi.object({
  initiator: Joi.string().valid('userA', 'userB', 'both').required(),
  severity: Joi.number().min(0).max(10).required(),
  recommendedAction: Joi.string().valid('none', 'warn', 'timeout', 'ban').required(),
  reason: Joi.string().required()
});

export const aiTicketSummarySchema = Joi.object({
  issue: Joi.string().required(),
  highlights: Joi.string().required(),
  resolution: Joi.string().required()
});
