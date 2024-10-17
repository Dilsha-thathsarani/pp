// backend/controllers/workspaceController.js

const pool = require('../config/db');

exports.createWorkspace = async (req, res) => {
    const userId = req.user.userId;
    const { organizationId, name, description } = req.body;

    try {
        // Check if the user belongs to the organization
        const orgCheck = await pool.query(
            'SELECT * FROM user_organizations WHERE user_id = $1 AND organization_id = $2',
            [userId, organizationId]
        );

        if (orgCheck.rows.length === 0) {
            return res.status(403).json({ message: 'You do not belong to this organization' });
        }

        // Insert new workspace
        const result = await pool.query(
            'INSERT INTO workspaces (name, description, organization_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description || null, organizationId, userId]
        );

        const workspace = result.rows[0];

        res.status(201).json({ message: 'Workspace created successfully', workspace });
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getWorkspaceDetails = async (req, res) => {
    const userId = req.user.userId;
    const { workspaceId } = req.params;

    try {
        // Check if the user has access to the workspace
        const workspaceResult = await pool.query(
            `SELECT w.id, w.name, w.description
             FROM workspaces w
             INNER JOIN organizations o ON w.organization_id = o.id
             INNER JOIN user_organizations uo ON o.id = uo.organization_id
             WHERE w.id = $1 AND uo.user_id = $2`,
            [workspaceId, userId]
        );

        if (workspaceResult.rows.length === 0) {
            return res.status(403).json({ message: 'You do not have access to this workspace' });
        }

        const workspace = workspaceResult.rows[0];

        // Fetch apps within the workspace
        const appsResult = await pool.query(
            'SELECT id, name FROM apps WHERE workspace_id = $1',
            [workspaceId]
        );

        const apps = appsResult.rows;

        res.status(200).json({ workspace, apps });
    } catch (error) {
        console.error('Error fetching workspace details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
