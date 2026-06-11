from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()
from rag.chain import build_rag_chain
from rag.retriever import get_related_docs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"message" : "Welcome to the Mental Health Chatbot"} 

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        docs = get_related_docs(req.message)
        context = "\n\n".join([doc.page_content for doc in docs])
        response = build_rag_chain().invoke({"context": context, "question": req.message})
        return {"reply": response}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)