const Message = require("../models/message");

const getChatResponse = async (req, res) => {
    try {
        const { message } = req.body;
        let username = req.user.username;
        if (!username && req.user.id) {
            try {
                const User = require("../models/user");
                const user = await User.findById(req.user.id);
                if (user) {
                    username = user.username;
                }
            } catch (err) {
                console.error("Chat username lookup error:", err);
            }
        }
        if (!username) {
            username = "User";
        }

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // Save the user's sent message
        const userMsg = new Message({
            username,
            message,
            type: "sent"
        });
        await userMsg.save();

        // Call the Python AI Agent
        let botResponse = "I'm sorry, I couldn't reach my agent. Please try again.";
        try {
            const agentUrl = (process.env.PYTHON_AGENT_URL || "http://127.0.0.1:8000").replace(/\/$/, "") + "/chat";
            const agentResponse = await fetch(agentUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });

            if (agentResponse.ok) {
                const data = await agentResponse.json();
                if (data.error) {
                    console.error("Agent returned error:", data.error);
                    botResponse = `Agent Error: ${data.error}`;
                } else {
                    botResponse = data.reply || "No reply from agent";
                }
            } else {
                console.error("Agent response not OK. Status:", agentResponse.status);
                botResponse = `Agent Error: Received status code ${agentResponse.status}`;
            }
        } catch (fetchError) {
            console.error("Error communicating with Python agent:", fetchError.message);
            botResponse = `Agent Error: ${fetchError.message}`;
        }

        // Save the bot's received message
        const botMsg = new Message({
            username,
            message: botResponse,
            type: "received",
            botResponse: botResponse
        });
        await botMsg.save();

        res.status(200).json({ botResponse });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: error.message || "Server error during chat processing" });
    }
};

module.exports = { getChatResponse };
