const cookie = require('cookie');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { COOKIE_NAME, verifyAccessToken } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

/** @type {Map<string, string>} userId → socket.id (last connection wins) */
const userIdToSocketId = new Map();

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

    userIdToSocketId.set(uid, socket.id);

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
      userIdToSocketId.set(uid, socket.id);
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

        const targetSocketId = userIdToSocketId.get(receiverId);
        if (targetSocketId) {
          await Message.updateOne({ _id: doc._id }, { $set: { status: 'delivered' } });
          io.to(targetSocketId).emit('receive_message', { ...out, status: 'delivered' });
        }
      } catch (err) {
        console.error(err);
        socket.emit('socket_error', { message: 'Failed to send message.' });
      }
    });

    socket.on('disconnect', () => {
      if (userIdToSocketId.get(uid) === socket.id) {
        userIdToSocketId.delete(uid);
      }
    });
  });

  return io;
}

module.exports = {
  attachSocketServer,
};
