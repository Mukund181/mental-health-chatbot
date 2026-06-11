const express = require("express");
const router = express.Router();
const { getChatResponse } = require("../controllers/chat");
const authorizeUser = require("../middleware/auth");

router.post("/", authorizeUser, getChatResponse);

module.exports = router;
