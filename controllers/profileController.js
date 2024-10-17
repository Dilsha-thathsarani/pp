// backend/controllers/profileController.js

const pool = require('../config/db');

exports.completeProfile = async (req, res) => {
    const { companyName, industry, useCase, organizationSize, phoneNumber } = req.body;
    const userId = req.user.userId;

    try {
        // Start a transaction
        await pool.query('BEGIN');

        // Update user profile
        await pool.query(
            'UPDATE users SET phone_number = $1 WHERE id = $2',
            [phoneNumber, userId]
        );

        // Create organization
        const orgResult = await pool.query(
            'INSERT INTO organizations (name, industry, size, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
            [companyName, industry, organizationSize, userId]
        );
        const orgId = orgResult.rows[0].id;

        // Insert into user_organizations
        await pool.query(
            'INSERT INTO user_organizations (user_id, organization_id, role) VALUES ($1, $2, $3)',
            [userId, orgId, 'Owner']
        );

        // Create Employee Network workspace
        const employeeWorkspaceResult = await pool.query(
            'INSERT INTO workspaces (name, organization_id, created_by) VALUES ($1, $2, $3) RETURNING id',
            ['Employee Network', orgId, userId]
        );
        const employeeWorkspaceId = employeeWorkspaceResult.rows[0].id;

        // Create Demo Workspace
        const demoWorkspaceResult = await pool.query(
            'INSERT INTO workspaces (name, organization_id, created_by) VALUES ($1, $2, $3) RETURNING id',
            ['Demo Workspace', orgId, userId]
        );
        const demoWorkspaceId = demoWorkspaceResult.rows[0].id;

        // Create default apps in Demo Workspace
        const defaultApps = [
            { name: 'Activity', fields: [{ name: 'Title', field_type: 'text', is_required: true }] },
            { name: 'Leads & Clients', fields: [{ name: 'Client Name', field_type: 'text', is_required: true }] },
            { name: 'Projects', fields: [{ name: 'Project Name', field_type: 'text', is_required: true }] },
            { name: 'Inspiration', fields: [{ name: 'Idea', field_type: 'text', is_required: true }] },
            { name: 'Meetings', fields: [{ name: 'Meeting Date', field_type: 'date', is_required: true }] },
            { name: 'Expenses', fields: [{ name: 'Amount', field_type: 'number', is_required: true }] },
        ];

        for (const appTemplate of defaultApps) {
            // Insert into apps table
            const appResult = await pool.query(
                'INSERT INTO apps (name, workspace_id, created_by) VALUES ($1, $2, $3) RETURNING id',
                [appTemplate.name, demoWorkspaceId, userId]
            );
            const appId = appResult.rows[0].id;

            // Insert app fields
            for (const field of appTemplate.fields) {
                await pool.query(
                    'INSERT INTO app_fields (app_id, name, field_type, is_required) VALUES ($1, $2, $3, $4)',
                    [appId, field.name, field.field_type, field.is_required]
                );
            }
        }

        // Commit the transaction
        await pool.query('COMMIT');

        res.status(200).json({ message: 'Profile completed and organization created successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error in profile completion:', error);
        res.status(500).json({ message: 'Error completing profile', error: error.message });
    }
};

// Get Current User Information
exports.getCurrentUser = async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
