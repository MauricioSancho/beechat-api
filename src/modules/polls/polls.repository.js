const { query, queryOne, execute, withTransaction, sql } = require('../../database/query');

/**
 * Build the poll response shape expected by Flutter.
 */
function formatPoll(poll, options) {
  return {
    id: poll.id,
    question: poll.question,
    allow_multiple: poll.allow_multiple === true || poll.allow_multiple === 1,
    is_closed: poll.is_closed === true || poll.is_closed === 1,
    total_votes: options.reduce((sum, o) => sum + (o.vote_count || 0), 0),
    options: options.map((o) => ({
      id: o.id,
      text: o.text,
      vote_count: o.vote_count || 0,
      voted_by_me: o.voted_by_me === 1 || o.voted_by_me === true,
    })),
  };
}

/**
 * Create a poll message + poll record + options inside a transaction.
 * Returns the full message object (without sender enrichment).
 */
async function create({ chatId, senderId, question, options, allowMultiple }) {
  return withTransaction(async ({ queryOne: tqo, execute: tex }) => {
    // 1. Insert message with type 'poll'
    const message = await tqo(
      `INSERT INTO Messages (chat_id, sender_id, content, message_type, reply_to_id, created_at, updated_at)
       OUTPUT INSERTED.id, INSERTED.uuid, INSERTED.chat_id, INSERTED.sender_id,
              INSERTED.content, INSERTED.message_type, INSERTED.is_deleted,
              INSERTED.is_edited, INSERTED.created_at
       VALUES (@chatId, @senderId, @question, 'poll', NULL, GETUTCDATE(), GETUTCDATE())`,
      [
        { name: 'chatId',   type: sql.Int,           value: chatId },
        { name: 'senderId', type: sql.Int,           value: senderId },
        { name: 'question', type: sql.NVarChar(500), value: question },
      ]
    );

    // 2. Insert poll record
    const poll = await tqo(
      `INSERT INTO Polls (message_id, chat_id, question, allow_multiple, created_at)
       OUTPUT INSERTED.id, INSERTED.question, INSERTED.allow_multiple, INSERTED.is_closed
       VALUES (@msgId, @chatId, @question, @allowMultiple, GETUTCDATE())`,
      [
        { name: 'msgId',         type: sql.Int,           value: message.id },
        { name: 'chatId',        type: sql.Int,           value: chatId },
        { name: 'question',      type: sql.NVarChar(500), value: question },
        { name: 'allowMultiple', type: sql.Bit,           value: allowMultiple ? 1 : 0 },
      ]
    );

    // 3. Insert each option
    const pollOptions = [];
    for (let i = 0; i < options.length; i++) {
      const opt = await tqo(
        `INSERT INTO PollOptions (poll_id, option_text, sort_order, created_at)
         OUTPUT INSERTED.id, INSERTED.option_text AS text
         VALUES (@pollId, @text, @sort, GETUTCDATE())`,
        [
          { name: 'pollId', type: sql.Int,           value: poll.id },
          { name: 'text',   type: sql.NVarChar(200), value: options[i] },
          { name: 'sort',   type: sql.Int,           value: i },
        ]
      );
      pollOptions.push({ id: opt.id, text: opt.text, vote_count: 0, voted_by_me: false });
    }

    return {
      message,
      poll: formatPoll(poll, pollOptions),
    };
  });
}

/**
 * Record a vote. For single-choice polls, removes the existing vote first.
 * Returns null (caller fetches fresh poll data afterwards).
 */
async function vote({ pollId, optionId, userId }) {
  const poll = await queryOne(
    `SELECT id, allow_multiple, is_closed FROM Polls WHERE id = @pollId`,
    [{ name: 'pollId', type: sql.Int, value: pollId }]
  );
  if (!poll) throw new Error('Poll not found');
  if (poll.is_closed === true || poll.is_closed === 1) throw new Error('Poll is closed');

  // Single-choice: delete any existing vote for this user in this poll
  if (!poll.allow_multiple) {
    await execute(
      `DELETE FROM PollVotes WHERE poll_id = @pollId AND user_id = @userId`,
      [
        { name: 'pollId', type: sql.Int, value: pollId },
        { name: 'userId', type: sql.Int, value: userId },
      ]
    );
  }

  // Insert vote (UNIQUE constraint prevents voting same option twice in multi-choice)
  await execute(
    `INSERT INTO PollVotes (poll_id, option_id, user_id, created_at)
     VALUES (@pollId, @optionId, @userId, GETUTCDATE())`,
    [
      { name: 'pollId',   type: sql.Int, value: pollId },
      { name: 'optionId', type: sql.Int, value: optionId },
      { name: 'userId',   type: sql.Int, value: userId },
    ]
  );
}

/**
 * Fetch poll + options + vote counts for a given message, from the POV of userId.
 */
async function findByMessageId(messageId, userId) {
  const poll = await queryOne(
    `SELECT id, question, allow_multiple, is_closed FROM Polls WHERE message_id = @messageId`,
    [{ name: 'messageId', type: sql.Int, value: messageId }]
  );
  if (!poll) return null;

  const options = await query(
    `SELECT po.id,
            po.option_text                                               AS text,
            COUNT(pv.id)                                                AS vote_count,
            MAX(CASE WHEN pv.user_id = @userId THEN 1 ELSE 0 END)      AS voted_by_me
     FROM PollOptions po
     LEFT JOIN PollVotes pv ON pv.option_id = po.id
     WHERE po.poll_id = @pollId
     GROUP BY po.id, po.option_text, po.sort_order
     ORDER BY po.sort_order, po.id`,
    [
      { name: 'pollId', type: sql.Int, value: poll.id },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );

  return formatPoll(poll, options);
}

/**
 * Get the message row for a poll (to build the full message response after voting).
 */
async function findMessageByPollId(pollId) {
  return queryOne(
    `SELECT m.id, m.uuid, m.chat_id, m.sender_id, m.content, m.message_type,
            m.is_deleted, m.is_edited, m.created_at,
            u.display_name AS sender_name, u.avatar_url AS sender_avatar,
            p.id AS poll_db_id
     FROM Polls p
     JOIN Messages m ON m.id = p.message_id
     JOIN Users u ON u.id = m.sender_id
     WHERE p.id = @pollId`,
    [{ name: 'pollId', type: sql.Int, value: pollId }]
  );
}

module.exports = { create, vote, findByMessageId, findMessageByPollId };
