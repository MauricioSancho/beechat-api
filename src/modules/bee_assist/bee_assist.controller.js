const beeAssistService = require('./bee_assist.service');
const { sendSuccess, asyncHandler } = require('../../utils/response.helper');

const suggestReply = asyncHandler(async (req, res) => {
  const { context, draft } = req.body;
  const result = await beeAssistService.suggestReplies({ context: context || '', draft: draft || '' });
  return sendSuccess(res, result);
});

const summarize = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  const result = await beeAssistService.summarizeConversation({ messages: messages || [] });
  return sendSuccess(res, result);
});

module.exports = { suggestReply, summarize };
