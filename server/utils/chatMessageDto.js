const mongoose = require('mongoose');

function mapReactions(m) {
  const list = Array.isArray(m.reactions) ? m.reactions : [];
  return list.map((r) => ({
    userId: String(r.userId),
    emoji: String(r.emoji || ''),
  }));
}

function toChatMessageDto(m, myId) {
  const sid = String(m.senderId);
  const rid = String(m.receiverId);
  const removedList = (m.removedForUsers || []).map((id) => String(id));
  const hiddenForMe = removedList.includes(String(myId));

  const baseReply =
    m.replyToMessageId && mongoose.Types.ObjectId.isValid(String(m.replyToMessageId))
      ? { id: String(m.replyToMessageId), preview: String(m.replyPreview || '') }
      : undefined;

  if (m.unsent) {
    const isSender = sid === String(myId);
    return {
      id: String(m._id),
      senderId: sid,
      receiverId: rid,
      message: '',
      timestamp: m.timestamp.toISOString(),
      ...(m.status ? { status: m.status } : {}),
      ...(m.seenAt ? { seenAt: m.seenAt.toISOString() } : {}),
      unsent: true,
      deletedForEveryone: true,
      tombstoneText: isSender ? 'You deleted a message' : 'This message was removed',
      reactions: [],
    };
  }

  if (hiddenForMe) {
    return {
      id: String(m._id),
      senderId: sid,
      receiverId: rid,
      message: 'You deleted a message',
      timestamp: m.timestamp.toISOString(),
      ...(m.status ? { status: m.status } : {}),
      ...(m.seenAt ? { seenAt: m.seenAt.toISOString() } : {}),
      viewerRemoved: true,
      reactions: [],
    };
  }

  const fwd = String(m.forwardedFromPreview || '').trim();
  const rx = mapReactions(m);
  return {
    id: String(m._id),
    senderId: sid,
    receiverId: rid,
    message: m.message,
    timestamp: m.timestamp.toISOString(),
    ...(m.status ? { status: m.status } : {}),
    ...(m.seenAt ? { seenAt: m.seenAt.toISOString() } : {}),
    ...(rx.length ? { reactions: rx } : {}),
    ...(baseReply ? { replyTo: baseReply } : {}),
    ...(fwd ? { forwardedFromPreview: fwd } : {}),
  };
}

module.exports = {
  mapReactions,
  toChatMessageDto,
};
