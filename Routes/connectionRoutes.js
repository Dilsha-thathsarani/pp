const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/auth");

// Get all connections for the authenticated user
router.get("/connections", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.connected_user_id, c.created_at, u.email
       FROM connections c
       JOIN users u ON c.connected_user_id = u.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send an invitation to connect
router.post("/connections/invite", authenticateToken, async (req, res) => {
  const { organizationId, email, message } = req.body;
  try {
    // Check if the user belongs to the organization
    const orgCheck = await db.query(
      "SELECT * FROM user_organizations WHERE user_id = $1 AND organization_id = $2",
      [req.user.id, organizationId]
    );
    if (orgCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "You do not belong to this organization" });
    }

    // Create invitation
    const result = await db.query(
      "INSERT INTO invitations (sender_id, recipient_email, organization_id, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, email, organizationId, message, "pending"]
    );

    const invitation = result.rows[0];
    const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation/${invitation.id}`;

    // Send an email invitation using the new email service
    await sendInvitationEmail(email, message, invitationLink);

    res.status(201).json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
