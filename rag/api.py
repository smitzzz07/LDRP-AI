from datetime import datetime
import os
import uuid
import traceback
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    File,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from rag import models
from rag.auth import get_current_user, router as auth_router
from rag.database import Base, engine, get_db
from rag.llm import generate_answer
from rag.pdf_chat import process_pdf, search_uploaded_pdf
from rag.retriever import ask_question
from rag.schemas import (
    ChatMessageResponse,
    ChatRequest,
    ConversationDetail,
    ConversationSummary,
)
# ============================================================
# DATABASE
# ============================================================
# Create database tables if they do not exist.
Base.metadata.create_all(bind=engine)
# ============================================================
# FASTAPI APPLICATION
# ============================================================
app = FastAPI(
    title="LDRP RAG API",
    description="RAG-based chatbot API for LDRP-ITR",
    version="1.0.0",
)
# ============================================================
# CORS
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ============================================================
# AUTH ROUTES
# ============================================================
app.include_router(auth_router)
# ============================================================
# BASIC ROUTES
# ============================================================
@app.get("/")
def root():
    return {
        "message": "LDRP RAG API is running"
    }
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
# ============================================================
# CONVERSATION HELPERS
# ============================================================
def make_conversation_title(question: str) -> str:
    """
    Create a short sidebar title from the first user question.
    """
    title = " ".join(
        question.strip().split()
    )
    if len(title) <= 52:
        return title
    return title[:52].rstrip() + "..."
def get_user_conversation(
    conversation_id: int,
    user_id: int,
    db: Session,
):
    """
    Get a conversation belonging to the logged-in user.
    """
    conversation = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.id == conversation_id,
            models.Conversation.user_id == user_id,
        )
        .first()
    )
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )
    return conversation
# ============================================================
# NORMAL RAG CHAT
# ============================================================
@app.post("/api/chat")
def chat(
    request: ChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Normal LDRP RAG chat endpoint.
    Flow:
    User Question
        |
    RAG Retriever
        |
    FAISS
        |
    Relevant Chunks
        |
    LLM
        |
    Answer
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )
    # --------------------------------------------------------
    # Reuse existing conversation
    # or create a new conversation
    # --------------------------------------------------------
    if request.conversation_id is not None:
        conversation = get_user_conversation(
            request.conversation_id,
            current_user.id,
            db,
        )
    else:
        conversation = models.Conversation(
            user_id=current_user.id,
            title=make_conversation_title(question),
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    # --------------------------------------------------------
    # Save user message
    # --------------------------------------------------------
    user_message = models.Message(
        conversation_id=conversation.id,
        role="user",
        content=question,
        sources=[],
    )
    db.add(user_message)
    db.commit()
    # --------------------------------------------------------
    # Run RAG
    # --------------------------------------------------------
    try:
        result = ask_question(question)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"RAG processing failed: {exc}",
        )
    # --------------------------------------------------------
    # Get answer
    # --------------------------------------------------------
    answer = result.get(
        "answer",
        "Unable to generate an answer.",
    )
    sources = result.get(
        "sources",
        [],
    ) or []
    # --------------------------------------------------------
    # Save assistant message
    # --------------------------------------------------------
    assistant_message = models.Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        sources=sources,
    )
    db.add(assistant_message)
    # Recently updated conversations appear first.
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_message)
    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------
    return {
        "conversation_id": conversation.id,
        "answer": answer,
        "sources": sources,
        "needs_web_search": result.get(
            "needs_web_search",
            False,
        ),
    }
# ============================================================
# CHAT HISTORY
# ============================================================
@app.get(
    "/api/chat/history",
    response_model=list[ConversationSummary],
)
def chat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return all conversations belonging to the logged-in user.
    """
    conversations = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.user_id == current_user.id
        )
        .order_by(
            models.Conversation.updated_at.desc()
        )
        .all()
    )
    return conversations
# ============================================================
# GET SINGLE CONVERSATION
# ============================================================
@app.get(
    "/api/chat/{conversation_id}",
    response_model=ConversationDetail,
)
def get_chat(
    conversation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get complete conversation including messages.
    """
    conversation = get_user_conversation(
        conversation_id,
        current_user.id,
        db,
    )
    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            ChatMessageResponse(
                id=message.id,
                role=message.role,
                content=message.content,
                sources=message.sources or [],
                created_at=message.created_at,
            )
            for message in conversation.messages
        ],
    )
# ============================================================
# DELETE CONVERSATION
# ============================================================
@app.delete(
    "/api/chat/{conversation_id}"
)
def delete_chat(
    conversation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a conversation belonging to the logged-in user.
    """
    conversation = get_user_conversation(
        conversation_id,
        current_user.id,
        db,
    )
    db.delete(conversation)
    db.commit()
    return {
        "message": "Conversation deleted successfully.",
        "conversation_id": conversation_id,
    }
# ============================================================
# PDF UPLOAD
# ============================================================
@app.post("/api/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """
    Upload and process a PDF.
    Flow:
    PDF
      |
    Save to data/uploads
      |
    Extract text
      |
    Chunk text
      |
    Create embeddings
      |
    FAISS index
      |
    Return document_id
    """
    # --------------------------------------------------------
    # Validate filename
    # --------------------------------------------------------
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a PDF.",
        )
    # --------------------------------------------------------
    # Validate extension
    # --------------------------------------------------------
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )
    # --------------------------------------------------------
    # Create upload directory
    # --------------------------------------------------------
    upload_dir = os.path.join(
        "data",
        "uploads",
    )
    os.makedirs(
        upload_dir,
        exist_ok=True,
    )
    # --------------------------------------------------------
    # Generate unique filename
    # --------------------------------------------------------
    safe_original_name = os.path.basename(
        file.filename
    )
    filename = (
        f"{uuid.uuid4()}_{safe_original_name}"
    )
    file_path = os.path.join(
        upload_dir,
        filename,
    )
    # --------------------------------------------------------
    # Save PDF
    # --------------------------------------------------------
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty.",
            )
        with open(
            file_path,
            "wb",
        ) as output:
            output.write(contents)
        # ----------------------------------------------------
        # Process PDF
        # ----------------------------------------------------
        result = process_pdf(
            file_path
        )
        return {
            "success": True,
            **result,
        }
    except HTTPException:
        raise
    except Exception as exc:
        print("\n========== PDF UPLOAD ERROR ==========")
        traceback.print_exc()
        print("Error details:", repr(exc))
        print("======================================\n")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {exc}",
        )
# ============================================================
# PDF CHAT
# ============================================================
@app.post("/api/pdf-chat")
def pdf_chat(
    request: dict,
    current_user: models.User = Depends(get_current_user),
):
    """
    Ask a question about an uploaded PDF.
    Request:
    {
        "document_id": "...",
        "question": "..."
    }
    """
    # --------------------------------------------------------
    # Get request values
    # --------------------------------------------------------
    document_id = request.get(
        "document_id"
    )
    question = request.get(
        "question",
        "",
    ).strip()
    # --------------------------------------------------------
    # Validate document
    # --------------------------------------------------------
    if not document_id:
        raise HTTPException(
            status_code=400,
            detail="No uploaded PDF selected.",
        )
    # --------------------------------------------------------
    # Validate question
    # --------------------------------------------------------
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )
    # --------------------------------------------------------
    # Search PDF
    # --------------------------------------------------------
    try:
        chunks = search_uploaded_pdf(
            document_id,
            question,
            top_k=5,
        )
        # ----------------------------------------------------
        # No relevant chunks
        # ----------------------------------------------------
        if not chunks:
            return {
                "answer": (
                    "I could not find relevant "
                    "information in the uploaded PDF."
                ),
                "sources": [],
            }
        # ----------------------------------------------------
        # Build context
        # ----------------------------------------------------
        context = "\n\n".join(
            [
                (
                    f"[Page {chunk['page']}]\n"
                    f"{chunk['text']}"
                )
                for chunk in chunks
            ]
        )
        # ----------------------------------------------------
        # LLM prompt
        # ----------------------------------------------------
        prompt = f"""
You are LDRP AI, an intelligent document analysis assistant.
The user has uploaded a document and asked a question about it.
Answer using the extracted PDF content provided below.
INSTRUCTIONS:
1. Identify the document type when supported by the content.
2. Answer the user's exact question directly.
3. For "What is this?" questions, explain the document's purpose,
   main sections, and the information it provides.
4. For scorecards, explain readable fields, subjects, marks,
   total scores, and other important details.
5. Use headings and bullet points when useful.
6. Give a detailed, helpful answer rather than a one-line response.
7. Never invent names, marks, dates, scores, or missing information.
8. Mention explicitly when some text is unreadable.
9. Explain what information is missing if the PDF does not support
   a complete answer.
PDF CONTENT:
{context}
USER QUESTION:
{question}
Provide a helpful answer with enough detail to explain the document.
"""
        # ----------------------------------------------------
        # Generate answer
        # ----------------------------------------------------
        result = generate_answer(prompt)
        # ----------------------------------------------------
        # Build sources
        # ----------------------------------------------------
        sources = [
            {
                "source_type": "pdf",
                "title": "Uploaded PDF",
                "page": chunk["page"],
            }
            for chunk in chunks
        ]
        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------
        return {
            "answer": result,
            "sources": sources,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"PDF question failed: {exc}",
        )
