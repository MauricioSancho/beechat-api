const pollsService = require('./polls.service');
const { sendCreated, sendSuccess, asyncHandler } = require('../../utils/response.helper');

const createPoll = asyncHandler(async (req, res) => {
  const chatId = parseInt(req.params.chatId, 10);
  const { question, options, allow_multiple } = req.body;

  const msg = await pollsService.createPoll(chatId, req.user.id, {
    question,
    options,
    allowMultiple: allow_multiple || false,
  });

  return sendCreated(res, msg);
});

const vote = asyncHandler(async (req, res) => {
  const chatId  = parseInt(req.params.chatId, 10);
  const pollId  = parseInt(req.params.pollId, 10);
  const optionId = req.body.option_id;

  const msg = await pollsService.votePoll(chatId, pollId, optionId, req.user.id);
  return sendSuccess(res, msg);
});

module.exports = { createPoll, vote };
