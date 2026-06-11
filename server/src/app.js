const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const authRouter = require("./routes/auth");
const msgRouter = require("./routes/chat");

const app = express();
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Token Cookie: ${!!req.cookies.token}`);
    next();
});

app.use(express.static(path.join(__dirname, "../../client")));

app.use("/auth",authRouter);
app.use("/messages",msgRouter);

module.exports = app;