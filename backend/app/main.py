import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from generator import generate_answer

app = FastAPI(
    title="PrepMate AI Backend",
    description="RAG-powered placement assistant API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str
    top_k: int = 2
    subject: str | None = None  # e.g., "OS", "DBMS", or None for All

class Citation(BaseModel):
    source: str
    page_number: int
    subject: str = "GENERAL"

class QueryResponse(BaseModel):
    answer: str
    sources: list[Citation]

@app.get("/")
def root_check():
    return {"status": "online", "message": "PrepMate AI Backend is active"}

@app.post("/api/ask", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    try:
        result = generate_answer(
            query=request.question,
            top_k=request.top_k,
            subject=request.subject
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")