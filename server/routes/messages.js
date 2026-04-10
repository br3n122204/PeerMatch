const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.get('/conversation/:otherUserId', authMiddleware, (req, res) =>
  void messageController.getConversation(req, res),
);

router.get('/conversations', authMiddleware, (req, res) =>
  void messageController.getConversations(req, res),
);

router.post('/seen', authMiddleware, (req, res) =>
  void messageController.markSeen(req, res),
);

router.delete('/:messageId', authMiddleware, (req, res) =>
  void messageController.deleteMessage(req, res),
);

router.delete('/conversation/:otherUserId', authMiddleware, (req, res) =>
  void messageController.deleteConversation(req, res),
);

module.exports = router;
