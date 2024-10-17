// backend/controllers/organizationController.js

const pool = require('../config/db');

exports.getUserOrganizations = async (req, res) => {
    const userId = req.user.userId;

    try {
        // Fetch organizations the user belongs to
        const orgResults = await pool.query(
            `SELECT o.id, o.name
             FROM organizations o
             INNER JOIN user_organizations uo ON o.id = uo.organization_id
             WHERE uo.user_id = $1`,
            [userId]
        );

        const organizations = orgResults.rows;

        // For each organization, fetch its workspaces
        for (const org of organizations) {
            const wsResults = await pool.query(
                `SELECT id, name
                 FROM workspaces
                 WHERE organization_id = $1`,
                [org.id]
            );

            org.workspaces = wsResults.rows;
        }

        res.json({ organizations });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
