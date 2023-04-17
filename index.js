const path = require("path");
const express = require("express");
const db = require("./db/postgresql.js");
const authRoutes = require("./routes/authRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const app = express();

const startApp = async () => {
    await db.connect();
    app.listen(3000);
}
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/users", userRoutes);
app.use(express.static(path.join(__dirname, "./client/build/")));
app.get("*", (req, res) => { res.sendFile(path.join(__dirname, "./client/build/index.html"))});
startApp();