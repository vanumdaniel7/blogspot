const express = require("express");
const authRoutes = require("./routes/authRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const db = require("./db/postgresql.js");
require("dotenv").config();
const app = express();

const startApp = async () => {
    await db.connect();
    app.listen(3000);
}
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/users", userRoutes);
startApp();