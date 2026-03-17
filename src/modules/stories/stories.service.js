const storiesRepo = require('./stories.repository');
const { ERRORS } = require('../../shared/constants');

async function createStory(userId, { contentType, contentUrl, textContent, bgColor }) {
  if (contentType !== 'text' && !contentUrl) {
    throw ERRORS.BAD_REQUEST('contentUrl is required for image/video stories');
  }
  return storiesRepo.create({ userId, contentType, contentUrl, textContent, bgColor });
}

async function listStories(userId) {
  const rows = await storiesRepo.findVisible(userId);
  const groupMap = new Map();
  for (const row of rows) {
    if (!groupMap.has(row.user_id)) {
      groupMap.set(row.user_id, {
        user_id: row.user_id,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        stories: [],
      });
    }
    groupMap.get(row.user_id).stories.push({
      id: row.id,
      user_id: row.user_id,
      content_type: row.content_type,
      content_url: row.content_url,
      text_content: row.text_content,
      bg_color: row.bg_color,
      expires_at: row.expires_at,
      created_at: row.created_at,
      view_count: row.view_count,
      viewed_by_me: row.viewed_by_me === 1,
    });
  }
  return Array.from(groupMap.values());
}

async function deleteStory(storyId, userId) {
  const story = await storiesRepo.findById(storyId);
  if (!story) throw ERRORS.NOT_FOUND('Story');
  if (story.user_id !== userId) throw ERRORS.FORBIDDEN('Cannot delete another user\'s story');
  await storiesRepo.deactivate(storyId, userId);
}

async function markViewed(storyId, viewerId) {
  const story = await storiesRepo.findById(storyId);
  if (!story || !story.is_active) throw ERRORS.NOT_FOUND('Story');
  if (story.user_id === viewerId) return; // No registrar vistas propias
  await storiesRepo.addView(storyId, viewerId);
}

async function getViewers(storyId, userId) {
  const story = await storiesRepo.findById(storyId);
  if (!story) throw ERRORS.NOT_FOUND('Story');
  if (story.user_id !== userId) throw ERRORS.FORBIDDEN('Can only see viewers of your own stories');
  return storiesRepo.findViewers(storyId);
}

async function muteUser(userId, mutedUserId) {
  if (userId === mutedUserId) throw ERRORS.BAD_REQUEST('Cannot mute yourself');
  await storiesRepo.mute(userId, mutedUserId);
}

async function unmuteUser(userId, mutedUserId) {
  await storiesRepo.unmute(userId, mutedUserId);
}

module.exports = { createStory, listStories, deleteStory, markViewed, getViewers, muteUser, unmuteUser };
