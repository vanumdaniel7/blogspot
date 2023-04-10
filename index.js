const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const db = require("./db/postgresql.js");
require("dotenv").config();
const app = express();
const PORT = 3000

db.connect();
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use("/auth", authRoutes);
app.use("/blogs", blogRoutes);
app.use("/users", userRoutes);
app.listen(PORT);