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

router.get("/", requireAuthentication, async (req, res) => {
    try {
        const { name } = req.query;
        const keywords = name.split(" ");
        const mainKeywords = [];
        for(let keyword of keywords) {
            if(keyword.trim !== "") {
                mainKeywords.push(keyword.trim());
            }
        }
        if(mainKeywords !== []) {
            const result = await db.getUserDetailsForSearch(mainKeywords);
            return res.status(200).json(result);
        }
        res.status(200).json({ data: [] });
    } catch(err) {
        res.status(500).json({ 
            info: "An unexpected error occured, please try again later", 
            status: "error", 
            title: "Error" 
        });
    }
});

router.get("/:id", requireAuthentication, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.getUserDetails(id);
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ 
            info: "An unexpected error occured, please try again later", 
            status: "error", 
            title: "Error" 
        });
    }
});

router.get("/:id/blogs/:loadcnt", requireAuthentication, async (req, res) => {
    try {
        const { id, loadcnt } = req.params;
        const result = await db.getBlogs(id, loadcnt);
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ 
            info: "An unexpected error occured, please try again later", 
            status: "error", 
            title: "Error" 
        });
    }
})

module.exports = router;