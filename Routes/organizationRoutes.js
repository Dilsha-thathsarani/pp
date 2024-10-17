const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");
const authMiddleware = require("../middleware/auth");

router.get(
  "/user-organizations",
  authMiddleware,
  organizationController.getUserOrganizations
);

module.exports = router;
