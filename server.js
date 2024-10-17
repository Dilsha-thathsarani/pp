// backend/server.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./Routes/authRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const tasksRoutes = require("./Routes/taskRoutes");
const usersRoutes = require("./Routes/users");
const organizationRoutes = require("./Routes/organizationRoutes");
const workspaceRoutes = require("./Routes/workspaceRoutes");
const appRoutes = require("./Routes/appRoutes");
const connectionRoutes = require("./Routes/connectionRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", tasksRoutes);
app.use("/api", usersRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/apps", appRoutes);
app.use("/api", connectionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
