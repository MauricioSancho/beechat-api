const storiesService = require('./stories.service');
const { sendSuccess, sendCreated, sendMessage, asyncHandler } = require('../../utils/response.helper');

const createStory = asyncHandler(async (req, res) => {
  const { contentType, textContent, bgColor } = req.body;

  let contentUrl = null;
  if (req.file) {
    const typeDir = req.file.destination.split('/').pop();
    contentUrl = `${process.env.BASE_URL}/uploads/${typeDir}/${req.file.filename}`;
  }

  const story = await storiesService.createStory(req.user.id, { contentType, contentUrl, textContent, bgColor });
  return sendCreated(res, story);
});

const listStories = asyncHandler(async (req, res) => {
  const stories = await storiesService.listStories(req.user.id);
  return sendSuccess(res, stories);
});

const deleteStory = asyncHandler(async (req, res) => {
  await storiesService.deleteStory(parseInt(req.params.storyId, 10), req.user.id);
  return sendMessage(res, 'Story deleted');
});

const markViewed = asyncHandler(async (req, res) => {
  await storiesService.markViewed(parseInt(req.params.storyId, 10), req.user.id);
  return sendMessage(res, 'Story marked as viewed');
});

const getViewers = asyncHandler(async (req, res) => {
  const viewers = await storiesService.getViewers(parseInt(req.params.storyId, 10), req.user.id);
  return sendSuccess(res, viewers);
});

const muteUser = asyncHandler(async (req, res) => {
  await storiesService.muteUser(req.user.id, parseInt(req.params.userId, 10));
  return sendMessage(res, 'User stories muted');
});

const unmuteUser = asyncHandler(async (req, res) => {
  await storiesService.unmuteUser(req.user.id, parseInt(req.params.userId, 10));
  return sendMessage(res, 'User stories unmuted');
});

module.exports = { createStory, listStories, deleteStory, markViewed, getViewers, muteUser, unmuteUser };
