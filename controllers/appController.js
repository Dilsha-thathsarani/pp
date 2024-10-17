const pool = require('../config/db');

exports.createApp = async (req, res) => {
    const userId = req.user.userId;
    const { workspaceId, name, fields } = req.body;

    if (!workspaceId || !name || !fields || !Array.isArray(fields)) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        // Check if the user has access to the workspace
        const workspaceCheck = await pool.query(
            `SELECT w.id
       FROM workspaces w
       INNER JOIN organizations o ON w.organization_id = o.id
       INNER JOIN user_organizations uo ON o.id = uo.organization_id
       WHERE w.id = $1 AND uo.user_id = $2`,
            [workspaceId, userId]
        );

        if (workspaceCheck.rows.length === 0) {
            return res.status(403).json({ message: 'You do not have access to this workspace' });
        }

        // Start a transaction
        await pool.query('BEGIN');

        // Insert into apps table
        const appResult = await pool.query(
            'INSERT INTO apps (name, workspace_id, created_by) VALUES ($1, $2, $3) RETURNING *',
            [name, workspaceId, userId]
        );
        const appId = appResult.rows[0].id;

        // Insert into app_fields table
        const fieldPromises = fields.map((field) => {
            const { name: fieldName, field_type, is_required } = field;
            return pool.query(
                'INSERT INTO app_fields (app_id, name, field_type, is_required) VALUES ($1, $2, $3, $4)',
                [appId, fieldName, field_type, is_required || false]
            );
        });

        await Promise.all(fieldPromises);

        // Commit the transaction
        await pool.query('COMMIT');

        res.status(201).json({ message: 'App created successfully', app: appResult.rows[0] });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error creating app:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAppsByWorkspace = async (req, res) => {
    const userId = req.user.userId;
    const { workspaceId } = req.params;

    try {
        // Check if the user has access to the workspace
        const workspaceCheck = await pool.query(
            `SELECT w.id
         FROM workspaces w
         INNER JOIN organizations o ON w.organization_id = o.id
         INNER JOIN user_organizations uo ON o.id = uo.organization_id
         WHERE w.id = $1 AND uo.user_id = $2`,
            [workspaceId, userId]
        );

        if (workspaceCheck.rows.length === 0) {
            return res.status(403).json({ message: 'You do not have access to this workspace' });
        }

        // Fetch apps
        const appsResult = await pool.query(
            'SELECT * FROM apps WHERE workspace_id = $1',
            [workspaceId]
        );

        res.status(200).json({ apps: appsResult.rows });
    } catch (error) {
        console.error('Error fetching apps:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
