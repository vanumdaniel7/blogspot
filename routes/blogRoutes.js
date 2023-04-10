const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db/postgresql.js");
const router = express.Router();

const requireAuthentication = (req, res, next) => {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err) {
            if(err.name === "TokenExpiredError") {
                return res.status(401).json({
                    status: "warning",
                    title: "Timeout",
                    info: "Token expired, please login again"
                });
            } else if(err.name === "JsonWebTokenError") {
                return res.status(401).json({
                    status: "error",
                    title: "Authentication error",
                    info: "User is not logged in"
                });
            }
        } else {
            res.locals.id = decoded.data.id;
            res.locals.email = decoded.data.email;
            res.locals.name = decoded.data.name;
            next();
        }
    });
}

router.post("/", requireAuthentication, async (req, res) => {
    try {
        let { title, content, tag1, tag2 } = req.body;
        const result = await db.createNewBlog(title, content, tag1, tag2, res.locals.id);
        return res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ 
            err:"An unexpected error occured, please try again later", 
            info: "error", 
            title: "Error" 
        });
    }
});

router.get("/load/:loadcnt", requireAuthentication, async (req, res) => {
    try {
        const { loadcnt } = req.params;
        const result = await db.loadMoreBlogs(loadcnt);
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ 
            err:"An unexpected error occured, please try again later", 
            info: "error", 
            title: "Error" 
        });
    }
});

module.exports = router;