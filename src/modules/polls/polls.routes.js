const { Router } = require('express');
const controller     = require('./polls.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// mergeParams: true — accede a :chatId del router padre
const router = Router({ mergeParams: true });
router.use(authMiddleware);

// POST /api/v1/chats/:chatId/polls
router.post('/', controller.createPoll);

// POST /api/v1/chats/:chatId/polls/:pollId/vote
router.post('/:pollId/vote', controller.vote);

module.exports = router;
