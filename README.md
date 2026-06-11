---
title: My Safe Space
emoji: 🌿
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🌿 SafeSpace — Empathetic Mental Health Companion


SafeSpace is a private, calm corner of the internet designed to help users process their thoughts and find emotional grounding. It integrates a secure Node.js authentication and backend gateway with a Python Retrieval-Augmented Generation (RAG) agent powered by Groq and LangChain.

---

## 🛠️ System Architecture

The project consists of three unified components:

```
[ Frontend: HTML/CSS/JS ] 
         │
         ▼ (Fetch requests with JWT Auth cookies)
[ Backend: Node.js Express ] ── (Saves chat history) ──► [ Database: MongoDB Atlas ]
         │
         ▼ (Proxied internal requests)
[ AI Agent: Python FastAPI ] ◄── (Retrieves context) ──► [ Vector Store: ChromaDB ]
         │
         ▼
[ Groq API (Llama 3.3 70b) ]
```

1. **Frontend (`client/`):** A beautiful, vanilla HTML/CSS/JS layout featuring light/dark theme toggles, clean responsive grids, and a typewriter animation for AI responses.
2. **Backend Gateway (`server/`):** An Express server that handles user registration/login, issues HTTP-only JWT cookies, saves messages securely, and forwards chat queries to the agent.
3. **AI Agent (`agent/`):** A FastAPI app implementing a RAG pipeline. It splits and indexes data using `langchain-huggingface` embeddings, stores them in ChromaDB, and queries Llama-3.3-70b via Groq.

---

## ✨ Key Features

* **Empathetic AI Companion:** Leverages a local knowledge base to answer questions with therapeutic frameworks.
* **JWT Cookie Authentication:** Securely signs users up/in, saving state natively in the browser without local storage vulnerabilities.
* **Database Persisted History:** All conversations are categorized by user and securely stored in MongoDB.
* **Offline Fallback System:** If the servers or LLMs are unreachable, the frontend automatically falls back to clean, rule-based local empathy scripts.
* **Typewriter Response Effect:** Snappy, word-by-word message rendering mimics premium AI chat interfaces.

---

## 🚀 Local Setup

### 1. Configure Environment Variables

Create a `.env` file inside the `agent/` folder:
```ini
GROQ_API_KEY="your_groq_api_key"
HUGGINGFACE_API="your_huggingface_api_token"
LANGCHAIN_API_KEY="your_optional_langchain_api_key"
LANGCHAIN_PROJECT="mental-health-bot"
```

Create a `.env` file inside the `server/` folder:
```ini
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret"
PORT=5000
```

### 2. Ingest Data (One-time Setup)
Place your reference text files inside `agent/docs/data.txt`, navigate to the `agent` folder, and run:
```bash
cd agent
python -m rag.ingest
```

### 3. Start the Servers

**Terminal 1 — Python Agent:**
```bash
cd agent
python app.py
```
*(Runs on `http://127.0.0.1:8000`)*

**Terminal 2 — Express Server:**
```bash
cd server
npm install
node server.js
```
*(Runs on `http://127.0.0.1:5000`)*

Open your browser to **`http://localhost:5000`** to access the app.

---

## 🐳 Deployment (Hugging Face Spaces)

This repository includes a `Dockerfile` designed to compile and run both servers concurrently inside a single container on a free Hugging Face Space.

1. Create a new Space on [Hugging Face](https://huggingface.co/spaces) and select **Docker** as the SDK.
2. In the Space's **Settings**, add the following Secrets:
   * `MONGODB_URI`
   * `JWT_SECRET`
   * `GROQ_API_KEY`
   * `HUGGINGFACE_API`
3. Push your repository to the Hugging Face Space. Hugging Face will automatically detect the `Dockerfile`, build the container, and serve your app.
