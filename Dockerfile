# Use Python base image
FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

WORKDIR /app

# Copy and install python dependencies
COPY agent/requirements.txt ./agent/
RUN pip install --no-cache-dir -r agent/requirements.txt

# Copy and install node dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

WORKDIR /app

# Copy all files
COPY . .

# Expose port 7860 (Hugging Face Spaces routes traffic here)
EXPOSE 7860

# Set production env variables
ENV PORT=7860
ENV PYTHON_AGENT_URL=http://127.0.0.1:8000

# Run data ingestion dynamically on start, then start both servers
CMD python agent/rag/ingest.py && python agent/app.py & node server/server.js
