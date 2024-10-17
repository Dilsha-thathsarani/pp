// backend/routes/workspaceRoutes.js

const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const authMiddleware = require('../middleware/auth');

router.post('/create', authMiddleware, workspaceController.createWorkspace);
router.get('/:workspaceId', authMiddleware, workspaceController.getWorkspaceDetails);

module.exports = router;
