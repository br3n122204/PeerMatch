const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * GET /api/messages/conversation/:otherUserId
 */
async function getConversation(req, res) {
  try {
    const myId = req.user.userId;
    const rawOther = String(req.params.otherUserId || '').trim();

    // Allow either MongoDB ObjectId OR a partial/full name (e.g. "Roch", "Ro").
    // This prevents "Could not load conversation" when the UI passes a name.
    let otherId = rawOther;
    if (rawOther && !mongoose.Types.ObjectId.isValid(rawOther)) {
      const tokens = rawOther
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const safeTokens = tokens.map((t) =>
        String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      );

      const nameQuery =
        safeTokens.length > 0
          ? {
              $and: safeTokens.map((token) => ({
                name: { $regex: token, $options: 'i' },
              })),
            }
          : null;

      const otherUser = nameQuery
        ? await User.findOne({
            verified: true,
            suspended: { $ne: true },
            ...nameQuery,
          }).select('_id')
        : null;

      if (!otherUser) {
        return res.json({ messages: [] });
      }
      otherId = String(otherUser._id);
    }

    if (!otherId || otherId === myId) {
      return res.json({ messages: [] });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    })
      .sort({ timestamp: 1 })
      .limit(500)
      .lean();

    return res.json({
      messages: messages.map((m) => ({
        id: String(m._id),
        senderId: String(m.senderId),
        receiverId: String(m.receiverId),
        message: m.message,
        timestamp: m.timestamp.toISOString(),
        ...(m.status ? { status: m.status } : {}),
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load messages.' });
  }
}

/**
 * GET /api/messages/conversations
 * Returns a list of conversation partners that have at least one message
 * with the authenticated user.
 *
 * Response:
 * { conversations: [{ otherUserId, otherName, lastMessagePreview, lastTimestamp, hasUnread }] }
 */
async function getConversations(req, res) {
  try {
    const myId = String(req.user.userId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(myId)) {
      return res.json({ conversations: [] });
    }

    const myObjId = new mongoose.Types.ObjectId(myId);

    const conversations = await Message.aggregate([
      { $match: { $or: [{ senderId: myObjId }, { receiverId: myObjId }] } },
      { $sort: { timestamp: -1 } },
      {
        $addFields: {
          otherUserId: {
            $cond: [{ $eq: ['$senderId', myObjId] }, '$receiverId', '$senderId'],
          },
        },
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessagePreview: { $first: '$message' },
          lastTimestamp: { $first: '$timestamp' },
          lastStatus: { $first: { $ifNull: ['$status', 'sent'] } },
          lastReceiverId: { $first: '$receiverId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          otherUserId: '$_id',
          otherName: { $ifNull: ['$user.name', 'Unknown'] },
          lastMessagePreview: 1,
          lastTimestamp: 1,
          hasUnread: {
            $cond: [
              {
                $and: [
                  { $eq: ['$lastReceiverId', myObjId] },
                  { $ne: ['$lastStatus', 'seen'] },
                ],
              },
              true,
              false,
            ],
          },
          _id: 0,
        },
      },
      { $sort: { lastTimestamp: -1 } },
      { $limit: 50 },
    ]);

    return res.json({
      conversations: conversations.map((c) => ({
        otherUserId: String(c.otherUserId),
        otherName: String(c.otherName || 'Unknown'),
        lastMessagePreview: String(c.lastMessagePreview || ''),
        lastTimestamp: c.lastTimestamp ? new Date(c.lastTimestamp).toISOString() : null,
        hasUnread: Boolean(c.hasUnread),
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not load conversations.' });
  }
}

/**
 * POST /api/messages/seen
 * Marks messages as seen for the authenticated receiver.
 * Expected body: { otherUserId: string }
 */
async function markSeen(req, res) {
  try {
    const myId = String(req.user.userId || '');
    const otherUserId = String(req.body?.otherUserId || '');

    if (!mongoose.Types.ObjectId.isValid(myId) || !mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: myId,
        $or: [{ status: { $in: ['sent', 'delivered'] } }, { status: { $exists: false } }],
      },
      { $set: { status: 'seen' } },
    );

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Could not mark messages as seen.' });
  }
}

module.exports = {
  getConversation,
  getConversations,
  markSeen,
};
