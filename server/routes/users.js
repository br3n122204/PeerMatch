const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const userResolveController = require('../controllers/userResolveController');
const userSearchController = require('../controllers/userSearchController');

const router = express.Router();

// GET /api/users/resolve?q=<name-or-id>
router.get('/resolve', authMiddleware, (req, res) =>
  void userResolveController.resolveUser(req, res),
);

// GET /api/users/search?q=<name partial OR exact ObjectId>
router.get('/search', authMiddleware, (req, res) =>
  void userSearchController.searchUsers(req, res),
);

module.exports = router;

