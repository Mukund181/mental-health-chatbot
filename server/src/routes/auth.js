const express = require("express");
const router = express.Router();
const { signUp, signIn, logout } = require("../controllers/auth");
const authorizeUser = require("../middleware/auth");

router.post("/register", signUp);
router.post("/login", signIn);
router.post("/logout", logout);

router.get("/profile", authorizeUser, async (req, res) => {
    let username = req.user.username;
    if (!username && req.user.id) {
        try {
            const User = require("../models/user");
            const user = await User.findById(req.user.id);
            if (user) {
                username = user.username;
            }
        } catch (err) {
            console.error("Profile lookup error:", err);
        }
    }
    res.json({ username: username || "User" });
});

module.exports = router;