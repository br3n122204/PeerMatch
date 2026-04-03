const cookie = require('cookie');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { COOKIE_NAME, verifyAccessToken } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

/** @type {Map<string, Set<string>>} userId → socket ids */
const userIdToSocketIds = new Map();

function isUserOnline(userId) {
  return (userIdToSocketIds.get(userId)?.size || 0) > 0;
}

function markUserSocketConnected(userId, socketId) {
  const existing = userIdToSocketIds.get(userId);
  if (existing) {
    existing.add(socketId);
    return false;
  }
  userIdToSocketIds.set(userId, new Set([socketId]));
  return true;
}

function markUserSocketDisconnected(userId, socketId) {
  const sockets = userIdToSocketIds.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size > 0) return false;
  userIdToSocketIds.delete(userId);
  return true;
}

function getTokenFromHandshake(handshake) {
  const authToken = handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) return authToken.trim();
  const parsed = cookie.parse(handshake.headers.cookie || '');
  return parsed[COOKIE_NAME] || '';
}

/**
 * @param {import('http').Server} httpServer
 * @param {{ allowedOrigins: string[] }} options
 */
function attachSocketServer(httpServer, options) {
  const { allowedOrigins } = options;

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = getTokenFromHandshake(socket.handshake);
    const user = verifyAccessToken(token);
    if (!user) {
      return next(new Error('Unauthorized'));
    }
    socket.userId = user.userId;
    socket.userRole = user.role;
    return next();
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;

    const becameOnline = markUserSocketConnected(uid, socket.id);
    if (becameOnline) {
      io.emit('presence_update', { userId: uid, online: true });
    }

    socket.emit('presence_snapshot', {
      onlineUserIds: Array.from(userIdToSocketIds.keys()),
    });

    // Deliver any previously-sent messages to this user (offline → online).
    // We mark them as delivered once we emit them.
    Message.find({
      receiverId: uid,
      $or: [{ status: 'sent' }, { status: { $exists: false } }],
    })
      .sort({ timestamp: 1 })
      .limit(200)
      .then(async (unread) => {
        if (!unread || unread.length === 0) return;
        const ids = unread.map((m) => m._id);

        await Message.updateMany({ _id: { $in: ids } }, { $set: { status: 'delivered' } });

        unread.forEach((m) => {
          socket.emit('receive_message', {
            id: String(m._id),
            senderId: String(m.senderId),
            receiverId: String(m.receiverId),
            message: m.message,
            timestamp: m.timestamp.toISOString(),
            status: 'delivered',
          });
        });
      })
      .catch((err) => {
        console.error('Failed to deliver unread messages', err);
      });

    socket.on('register', (payload) => {
      const requested = String(payload?.userId || '').trim();
      if (requested !== uid) {
        socket.emit('socket_error', { message: 'Invalid registration.' });
        return;
      }
      const justOnline = markUserSocketConnected(uid, socket.id);
      if (justOnline) {
        io.emit('presence_update', { userId: uid, online: true });
      }
    });

    socket.on('send_message', async (payload) => {
      try {
        const receiverId = String(payload?.receiverId || '').trim();
        const text = String(payload?.message || '').trim();

        if (!receiverId || !text) {
          socket.emit('socket_error', { message: 'Message and recipient are required.' });
          return;
        }
        if (receiverId === uid) {
          socket.emit('socket_error', { message: 'Cannot message yourself.' });
          return;
        }
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
          socket.emit('socket_error', { message: 'Invalid recipient.' });
          return;
        }

        const receiver = await User.findById(receiverId).select('_id').lean();
        if (!receiver) {
          socket.emit('socket_error', { message: 'Recipient not found.' });
          return;
        }

        const doc = await Message.create({
          senderId: uid,
          receiverId,
          message: text,
          timestamp: new Date(),
          status: 'sent',
        });

        const out = {
          id: String(doc._id),
          senderId: uid,
          receiverId,
          message: text,
          timestamp: doc.timestamp.toISOString(),
          status: 'sent',
        };

        const receiverSockets = userIdToSocketIds.get(receiverId);
        if (receiverSockets && receiverSockets.size > 0) {
          await Message.updateOne({ _id: doc._id }, { $set: { status: 'delivered' } });
          for (const sid of receiverSockets) {
            io.to(sid).emit('receive_message', { ...out, status: 'delivered' });
          }
        }
      } catch (err) {
        console.error(err);
        socket.emit('socket_error', { message: 'Failed to send message.' });
      }
    });

    socket.on('disconnect', () => {
      const becameOffline = markUserSocketDisconnected(uid, socket.id);
      if (becameOffline) {
        io.emit('presence_update', { userId: uid, online: false });
      }
    });
  });

  return io;
}

module.exports = {
  attachSocketServer,
};
