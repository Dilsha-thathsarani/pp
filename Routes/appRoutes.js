const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, appController.createApp);
router.get('/workspace/:workspaceId', authMiddleware, appController.getAppsByWorkspace);

module.exports = router;
