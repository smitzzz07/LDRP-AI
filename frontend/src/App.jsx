import { useEffect, useRef, useState } from "react";

import "./App.css";
import "./LDRP_App_chatgpt_pdf_card.css";
import logoImg from "./assets/logo.webp";



import Login from "./pages/Login";

import Signup from "./pages/Signup";

import ResetPassword from "./pages/ResetPassword";



const API_BASE = "http://127.0.0.1:8000/api";



const CHAT_API = `${API_BASE}/chat`;

const AUTH_API = `${API_BASE}/auth`;

const PDF_UPLOAD_API = `${API_BASE}/upload-pdf`;

const PDF_CHAT_API = `${API_BASE}/pdf-chat`;



const WELCOME_MESSAGE = {

  role: "assistant",

  content:

    "Hello! I’m the LDRP-ITR AI Assistant.\n Ask me anything about LDRP, MCA syllabus, courses, and academic information.",

};



const suggestedQuestions = [

  "What is the credit of Software Testing?",

  "What subjects are in MCA Semester 3?",

  "What is the MCA-37 subject?",

  "What is the total credit of Semester 3?",

];



function getStoredToken() {

  return (

    localStorage.getItem("access_token") ||

    sessionStorage.getItem("access_token")

  );

}



function getSavedUser() {

  try {

    const localUser = localStorage.getItem("user");



    if (localUser) {

      return JSON.parse(localUser);

    }



    const sessionUser = sessionStorage.getItem("user");



    if (sessionUser) {

      return JSON.parse(sessionUser);

    }



    return null;

  } catch {

    return null;

  }

}



function clearAuth() {

  localStorage.removeItem("access_token");

  localStorage.removeItem("user");



  sessionStorage.removeItem("access_token");

  sessionStorage.removeItem("user");

}



function ChatApp({ user, onLogout }) {

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const [question, setQuestion] = useState("");

  const [started, setStarted] = useState(false);

  const [loading, setLoading] = useState(false);



  // PDF states

  const [uploadedPdf, setUploadedPdf] = useState(null);

  const [uploadingPdf, setUploadingPdf] = useState(false);



  const fileInputRef = useRef(null);

  const [pdfAttachmentSent, setPdfAttachmentSent] = useState(false);

  const [expandedSources, setExpandedSources] = useState({});

  const [conversationId, setConversationId] = useState(null);



  const [history, setHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(true);

  const [historyOpen, setHistoryOpen] = useState(true);

  const [deletingId, setDeletingId] = useState(null);



  const authHeaders = () => {

    const token = getStoredToken();



    return token

      ? {

          Authorization: `Bearer ${token}`,

        }

      : {};

  };



  // ---------------------------------------------------------

  // LOAD CHAT HISTORY

  // ---------------------------------------------------------



  const loadHistory = async () => {

    setHistoryLoading(true);



    try {

      const response = await fetch(`${CHAT_API}/history`, {

        headers: {

          ...authHeaders(),

        },

      });



      if (!response.ok) {

        if (response.status === 401) {

          onLogout();

        }



        setHistory([]);

        return;

      }



      const data = await response.json();



      setHistory(Array.isArray(data) ? data : []);

    } catch {

      setHistory([]);

    } finally {

      setHistoryLoading(false);

    }

  };



  useEffect(() => {

    loadHistory();

  }, []);



  // ---------------------------------------------------------

  // LOAD CONVERSATION

  // ---------------------------------------------------------



  const loadConversation = async (id) => {

    if (loading || id === conversationId) return;



    try {

      const response = await fetch(`${CHAT_API}/${id}`, {

        headers: {

          ...authHeaders(),

        },

      });



      if (!response.ok) {

        if (response.status === 401) {

          onLogout();

        }



        return;

      }



      const data = await response.json();



      const loadedMessages =

        data.messages && data.messages.length > 0

          ? data.messages.map((message) => ({

              role: message.role,

              content: message.content,

              sources: message.sources || [],

            }))

          : [WELCOME_MESSAGE];



      setConversationId(data.id);

      setMessages(loadedMessages);

      setStarted(loadedMessages.length > 1);

      setExpandedSources({});

      setQuestion("");



      // Uploaded PDF belongs to the current temporary session.

      setUploadedPdf(null);
      setPdfAttachmentSent(false);

    } catch {

      // Keep current chat if loading fails.

    }

  };



  // ---------------------------------------------------------

  // PDF UPLOAD

  // ---------------------------------------------------------



  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Please select a PDF file.");
      return;
    }

    setUploadingPdf(true);
    setPdfAttachmentSent(false);

    // Show the selected filename immediately.
    setUploadedPdf({
      documentId: null,
      filename: file.name,
      pages: null,
      chunks: null,
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = getStoredToken();

      if (!token) {
        throw new Error("Your login session has expired.");
      }

      const response = await fetch(PDF_UPLOAD_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "PDF upload failed."
        );
      }

      setUploadedPdf({
        documentId: data.document_id,
        filename: data.filename || file.name,
        pages: data.pages,
        chunks: data.chunks,
      });

      setStarted(true);

      // The selected PDF stays in the composer until the user sends a question.
    } catch (error) {
      setUploadedPdf(null);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `❌ PDF upload failed.\n\n${
              error.message || "Unknown error"
            }`,
          error: true,
        },
      ]);
    } finally {
      setUploadingPdf(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ---------------------------------------------------------

  // REMOVE PDF

  // ---------------------------------------------------------



  const removeUploadedPdf = () => {
    setUploadedPdf(null);
    setPdfAttachmentSent(false);
  };



  // ---------------------------------------------------------

  // SEND MESSAGE

  // ---------------------------------------------------------



  const sendMessage = async (text = question) => {

    const userQuestion = text.trim();



    if (!userQuestion || loading || uploadingPdf) return;

    // Move the selected PDF into the first user message, like ChatGPT.
    const attachmentForMessage =
      uploadedPdf && !pdfAttachmentSent
        ? { ...uploadedPdf }
        : null;

    setStarted(true);

    if (attachmentForMessage) {
      setPdfAttachmentSent(true);
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userQuestion,
        attachment: attachmentForMessage,
      },
    ]);



    setQuestion("");

    setLoading(true);



    try {

      const token = getStoredToken();



      if (!token) {

        throw new Error("Your login session has expired.");

      }



      let response;



      // -----------------------------------------------------

      // IF PDF IS UPLOADED

      // -----------------------------------------------------



      if (uploadedPdf) {
        if (!uploadedPdf.documentId) {
          throw new Error(
            "Please wait until the PDF upload finishes."
          );
        }

        response = await fetch(PDF_CHAT_API, {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({

            document_id: uploadedPdf.documentId,

            question: userQuestion,

          }),

        });

      }



      // -----------------------------------------------------

      // NORMAL LDRP RAG CHAT

      // -----------------------------------------------------



      else {

        const body = {

          question: userQuestion,

        };



        if (conversationId !== null) {

          body.conversation_id = conversationId;

        }



        response = await fetch(CHAT_API, {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify(body),

        });

      }



      const data = await response.json();



      if (!response.ok) {

        if (response.status === 401) {

          onLogout();

          return;

        }



        throw new Error(

          data.detail || "Unable to generate an answer."

        );

      }



      // Normal chat creates/updates conversation.

      if (data.conversation_id) {

        setConversationId(data.conversation_id);

      }



      setMessages((prev) => [

        ...prev,

        {

          role: "assistant",

          content:

            data.answer ||

            "I could not generate an answer.",

          sources: data.sources || [],

          needsWebSearch: data.needs_web_search,

        },

      ]);



      // Refresh history only for normal LDRP conversations.

      if (!uploadedPdf) {

        await loadHistory();

      }

    } catch (error) {

      setMessages((prev) => [

        ...prev,

        {

          role: "assistant",

          content:

            error.message ||

            "I couldn't connect to the LDRP AI server.",

          error: true,

        },

      ]);

    } finally {

      setLoading(false);

    }

  };



  // ---------------------------------------------------------

  // ENTER KEY

  // ---------------------------------------------------------



  const handleKeyDown = (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

      event.preventDefault();

      sendMessage();

    }

  };



  // ---------------------------------------------------------

  // NEW CHAT

  // ---------------------------------------------------------



  const newChat = () => {

    setConversationId(null);

    setMessages([WELCOME_MESSAGE]);

    setQuestion("");

    setStarted(false);

    setExpandedSources({});



    // Clear temporary uploaded PDF.

    setUploadedPdf(null);
    setPdfAttachmentSent(false);



    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  };



  // ---------------------------------------------------------

  // DELETE CONVERSATION

  // ---------------------------------------------------------



  const deleteConversation = async (event, id) => {

    event.stopPropagation();



    setDeletingId(id);



    try {

      const response = await fetch(`${CHAT_API}/${id}`, {

        method: "DELETE",

        headers: {

          ...authHeaders(),

        },

      });



      if (!response.ok) {

        if (response.status === 401) {

          onLogout();

        }



        return;

      }



      setHistory((prev) =>

        prev.filter((item) => item.id !== id)

      );



      if (conversationId === id) {

        newChat();

      }

    } finally {

      setDeletingId(null);

    }

  };



  // ---------------------------------------------------------

  // UI

  // ---------------------------------------------------------



  return (

    <div className="app">



      {/* Background */}

      <div className="background">

        <div className="orb orb-one"></div>

        <div className="orb orb-two"></div>

        <div className="orb orb-three"></div>



        <div className="grid"></div>



        <div className="floating-ring ring-one"></div>

        <div className="floating-ring ring-two"></div>

      </div>



      {/* HEADER */}

      <header className="header glass">



        <div className="header-left">



          <button

            type="button"

            className="header-menu"

            onClick={() =>

              setHistoryOpen((value) => !value)

            }

            title={

              historyOpen

                ? "Hide chat history"

                : "Show chat history"

            }

            aria-label="Toggle chat history"

          >

            ☰

          </button>



          <div className="brand">



            <div className="logo">
              <img src={logoImg} alt="LDRP Logo" className="brand-logo-img" />
            </div>

            <div className="brand-text">

              <h1>LDRP AI</h1>

              <p>AI Academic Assistant</p>

            </div>



          </div>



        </div>



        <div className="header-right">



          <div className="status">

            <span className="status-dot"></span>

            AI Online

          </div>



          <button

            className="new-chat"

            onClick={newChat}

          >

            + New Chat

          </button>



          <div className="user-menu">



            <div className="user-avatar-small">

              {(user?.name || "U")

                .charAt(0)

                .toUpperCase()}

            </div>



            <div className="user-info">

              <strong>

                {user?.name || "User"}

              </strong>



              <span>

                {user?.email || ""}

              </span>

            </div>



            <button

              className="logout-button"

              onClick={onLogout}

              title="Logout"

              aria-label="Logout"

            >

              ↪

            </button>



          </div>



        </div>



      </header>



      {/* WORKSPACE */}

      <div className="workspace">



        {/* CHAT HISTORY */}

        <aside

          className={`history-sidebar ${

            historyOpen ? "open" : "closed"

          }`}

        >



          <div className="history-top">



            <div className="history-heading">



              <div className="history-title">

                <span className="history-title-icon">

                  ◫

                </span>



                <span>Chat History</span>

              </div>



              <span className="history-count">

                {history.length}

              </span>



            </div>



            <button

              className="history-new"

              onClick={newChat}

              title="New chat"

            >

              <span>＋</span>

              <span>New chat</span>

            </button>



          </div>



          <div className="history-list">



            {historyLoading ? (

              <div className="history-empty">

                <div className="history-loader"></div>

                <span>Loading chats...</span>

              </div>

            ) : history.length === 0 ? (

              <div className="history-empty">

                <div className="history-empty-icon">

                  ✦

                </div>



                <strong>No conversations yet</strong>



                <span>

                  Your saved chats will appear here.

                </span>

              </div>

            ) : (

              history.map((item) => (

                <button

                  className={`history-item ${

                    conversationId === item.id

                      ? "active"

                      : ""

                  }`}

                  key={item.id}

                  onClick={() =>

                    loadConversation(item.id)

                  }

                >



                  <span className="history-item-icon">

                    ◇

                  </span>



                  <span className="history-item-body">



                    <strong>{item.title}</strong>



                    <small>

                      {new Date(

                        item.updated_at

                      ).toLocaleDateString(

                        undefined,

                        {

                          day: "2-digit",

                          month: "short",

                        }

                      )}

                    </small>



                  </span>



                  <span

                    className="history-delete"

                    onClick={(event) =>

                      deleteConversation(

                        event,

                        item.id

                      )

                    }

                    title="Delete conversation"

                  >

                    {deletingId === item.id

                      ? "…"

                      : "×"}

                  </span>



                </button>

              ))

            )}



          </div>



          <div className="history-bottom">



            <div className="history-account">



              <div className="history-account-avatar">

                {(user?.name || "U")

                  .charAt(0)

                  .toUpperCase()}

              </div>



              <div>

                <strong>

                  {user?.name || "User"}

                </strong>



                <span>

                  Personal workspace

                </span>

              </div>



            </div>



          </div>



        </aside>



        {/* HISTORY TOGGLE */}

        <button

          className="history-toggle"

          onClick={() =>

            setHistoryOpen((value) => !value)

          }

          title={

            historyOpen

              ? "Hide history"

              : "Show history"

          }

          aria-label="Toggle history"

        >

          {historyOpen ? "‹" : "›"}

        </button>



        {/* MAIN CHAT */}

        <main

          className={`chat-container ${

            started ? "chat-started" : ""

          }`}

        >



          {/* HERO */}

          <section

            className={`hero ${

              started ? "hero-started" : ""

            }`}

          >



            <div className="ai-orb">



              <div className="orb-core">

                🎓

              </div>



              <div className="orb-ring ring-a"></div>

              <div className="orb-ring ring-b"></div>



            </div>



            <div className="hero-badge">

              ✦ LDRP INTELLIGENCE

            </div>



            <h2>

              Ask anything.

              <br />

              <span>Get intelligent answers.</span>

            </h2>



            <p>

              Your AI-powered academic assistant

              for LDRP-ITR information and MCA

              resources.

            </p>



            <div className="compact-chat-title">

              <span className="compact-dot"></span>

              LDRP AI

            </div>



          </section>



          {/* SUGGESTIONS */}

          <section

            className={`suggestions ${

              started

                ? "suggestions-hidden"

                : ""

            }`}

          >



            {suggestedQuestions.map(

              (item, index) => (

                <button

                  className="suggestion glass"

                  key={item}

                  onClick={() =>

                    sendMessage(item)

                  }

                  style={{

                    animationDelay: `${

                      index * 0.08

                    }s`,

                  }}

                >



                  <span className="suggestion-icon">

                    {

                      [

                        "📚",

                        "🎓",

                        "🔎",

                        "📊",

                      ][index]

                    }

                  </span>



                  <span>{item}</span>



                  <span className="suggestion-arrow">

                    →

                  </span>



                </button>

              )

            )}



          </section>



          {/* MESSAGES */}

          <section

            className={`messages ${

              started

                ? "messages-visible"

                : ""

            }`}

          >



            {messages.map(

              (message, index) => (

                <div

                  className={`message-row ${message.role}`}

                  key={`${conversationId || "new"}-${index}`}

                >



                  {message.role ===

                  "assistant" ? (

                    <div className="assistant-avatar">

                      L

                    </div>

                  ) : (

                    <div className="user-avatar">

                      You

                    </div>

                  )}



                  <div className="message-content">



                    <div

                      className={`message-bubble ${

                        message.error

                          ? "error"

                          : ""

                      }`}

                    >



                      {message.role ===

                        "assistant" && (

                        <div className="assistant-label">

                          LDRP AI

                        </div>

                      )}



                      {message.role === "user" && message.attachment && (
                        <div
                          className="message-pdf-attachment"
                          title={message.attachment.filename}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            marginBottom: "10px",
                            maxWidth: "280px",
                            border: "1px solid rgba(196, 166, 255, 0.28)",
                            borderRadius: "12px",
                            background: "rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          <div
                            aria-hidden="true"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flex: "0 0 38px",
                              height: "44px",
                              borderRadius: "8px",
                              background: "#e9d5ff",
                              color: "#5b21b6",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            PDF
                          </div>
                          <div
                            style={{
                              minWidth: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <strong
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "12px",
                                maxWidth: "205px",
                              }}
                            >
                              {message.attachment.filename}
                            </strong>
                            <small style={{ opacity: 0.72, fontSize: "11px" }}>
                              {message.attachment.pages ?? "—"} pages
                            </small>
                          </div>
                        </div>
                      )}

                      <div className="answer-text">
                        {message.content}
                      </div>



                    </div>



                    {/* SOURCES */}

                    {message.sources &&

                      message.sources.length >

                        0 &&

                      (() => {

                        const isExpanded =

                          !!expandedSources[

                            index

                          ];



                        const visibleSources =

                          isExpanded

                            ? message.sources

                            : message.sources.slice(

                                0,

                                1

                              );



                        const hiddenCount =

                          Math.max(

                            message.sources

                              .length - 1,

                            0

                          );



                        return (

                          <div className="sources">



                            <div className="sources-title">

                              <span>◈</span>

                              Sources

                            </div>



                            {visibleSources.map(

                              (

                                source,

                                sourceIndex

                              ) => (

                                <div

                                  className="source-card glass"

                                  key={`${index}-${sourceIndex}`}

                                >



                                  <div className="source-icon">

                                    {source.source_type ===

                                    "pdf"

                                      ? "📄"

                                      : "🌐"}

                                  </div>



                                  <div className="source-info">



                                    <strong>

                                      {source.title ||

                                        source.source ||

                                        "LDRP Source"}

                                    </strong>



                                    <span>

                                      {source.source_type ===

                                      "pdf"

                                        ? `PDF • Page ${

                                            source.page ??

                                            "N/A"

                                          }`

                                        : "Official LDRP Website"}

                                    </span>



                                  </div>



                                  {source.url && (

                                    <a

                                      href={

                                        source.url

                                      }

                                      target="_blank"

                                      rel="noopener noreferrer"

                                      className="source-open"

                                    >

                                      Open ↗

                                    </a>

                                  )}



                                </div>

                              )

                            )}



                            {message.sources.length >

                              1 && (

                              <button

                                type="button"

                                className="sources-toggle"

                                onClick={() =>

                                  setExpandedSources(

                                    (prev) => ({

                                      ...prev,

                                      [index]:

                                        !isExpanded,

                                    })

                                  )

                                }

                              >

                                {isExpanded

                                  ? "− Show less"

                                  : `+ View ${hiddenCount} more`}

                              </button>

                            )}



                          </div>

                        );

                      })()}



                  </div>



                </div>

              )

            )}



            {/* LOADING */}

            {loading && (

              <div className="message-row assistant">



                <div className="assistant-avatar">

                  L

                </div>



                <div className="message-content">



                  <div className="message-bubble loading-bubble">



                    <div className="assistant-label">

                      LDRP AI

                    </div>



                    <div className="thinking">



                      <span></span>

                      <span></span>

                      <span></span>



                      <small>

                        {uploadedPdf

                          ? "Reading uploaded PDF..."

                          : "Searching knowledge base..."}

                      </small>



                    </div>



                  </div>



                </div>



              </div>

            )}



          </section>



        </main>



      </div>



      {/* INPUT */}

      <footer

        className={`input-area ${

          started ? "input-started" : ""

        }`}

      >



        <div className="input-glow"></div>



        <div className={`input-wrapper glass ${uploadedPdf ? "has-attachment" : ""}`}>

          {/* Hidden PDF picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handlePdfUpload}
            style={{ display: "none" }}
          />

          {/* Keep the attachment in the composer until its first question is sent. */}
          {uploadedPdf && !pdfAttachmentSent && (
            <div className="composer-attachment-row">
              <div className="uploaded-pdf" title={uploadedPdf.filename}>
                <div className="uploaded-pdf-icon" aria-hidden="true">
                  <span className="pdf-icon-fold">PDF</span>
                </div>

                <div className="uploaded-pdf-info">
                  <strong>{uploadedPdf.filename}</strong>
                  <small>
                    {uploadingPdf
                      ? "Uploading and reading PDF…"
                      : `${uploadedPdf.pages ?? "—"} pages · ${uploadedPdf.chunks ?? "—"} text chunks`}
                  </small>
                </div>

                {uploadingPdf && <span className="pdf-upload-status" aria-label="Uploading" />}

                <button
                  type="button"
                  className="uploaded-pdf-remove"
                  onClick={removeUploadedPdf}
                  disabled={uploadingPdf || loading}
                  title="Remove PDF"
                  aria-label="Remove uploaded PDF"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Composer controls stay on their own row below the attachment */}
          <div className="composer-input-row">
            <button
              type="button"
              className="pdf-upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadingPdf}
              title="Upload PDF"
              aria-label="Upload PDF"
            >
              {uploadingPdf ? "…" : "+"}
            </button>

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask LDRP AI anything..."
              rows="1"
              disabled={loading}
            />

            <button
              className="send-button"
              onClick={() => sendMessage()}
              disabled={!question.trim() || loading || uploadingPdf}
              aria-label="Send message"
            >
              <span>↑</span>
            </button>
          </div>
        </div>



        <p>

          {uploadedPdf

            ? "PDF Chat • Answers are based on your uploaded document"

            : "LDRP-ITR AI • Powered by RAG & Gemini • Enter to send"}

        </p>



      </footer>



    </div>

  );

}



// ---------------------------------------------------------

// MAIN APP

// ---------------------------------------------------------



function App() {

  const [screen, setScreen] =

    useState("checking");



  const [user, setUser] = useState(null);



  useEffect(() => {

    const checkAuthentication = async () => {



      // Password reset links

      const params = new URLSearchParams(

        window.location.search

      );



      const resetToken =

        params.get("reset_token");



      if (resetToken) {

        setScreen("reset");

        return;

      }



      const token = getStoredToken();



      if (!token) {

        setScreen("login");

        return;

      }



      try {

   
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

let response;

try {
  response = await fetch(`${AUTH_API}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });
} finally {
  clearTimeout(timeoutId);
}




        if (!response.ok) {

          clearAuth();

          setUser(null);

          setScreen("login");

          return;

        }



        const data = await response.json();



        const currentUser = {

          id: data.id,

          name: data.name,

          email: data.email,

        };



        const remembered =

          localStorage.getItem(

            "access_token"

          );



        const storage = remembered

          ? localStorage

          : sessionStorage;



        storage.setItem(

          "user",

          JSON.stringify(currentUser)

        );



        setUser(currentUser);

        setScreen("chat");



      } catch {

        clearAuth();

        setUser(null);

        setScreen("login");

      }

    };



    checkAuthentication();

  }, []);



  const handleLogin = (loginData) => {

    setUser(loginData);

    setScreen("chat");

  };



  const handleSignup = (signupData) => {

    setUser(signupData);

    setScreen("chat");

  };



  const handleLogout = () => {

    clearAuth();

    setUser(null);

    setScreen("login");

  };



  // Checking

  if (screen === "checking") {

    return (

      <div className="auth-page">



        <div className="auth-card">



          <div className="auth-logo">



            <img src={logoImg} alt="LDRP Logo" className="auth-logo-img" />



            <div>

              <h1>LDRP AI</h1>

              <span>

                Academic Assistant

              </span>

            </div>



          </div>



          <div className="auth-heading">



            <h2>Checking session...</h2>



            <p>

              Please wait while we verify

              your account.

            </p>



          </div>



          <div

            className="auth-submit"

            style={{

              cursor: "default",

            }}

          >

            <span className="auth-spinner" />

            Loading...

          </div>



        </div>



      </div>

    );

  }



  // Reset password

  if (screen === "reset") {



    const params = new URLSearchParams(

      window.location.search

    );



    const resetToken =

      params.get("reset_token");



    return (

      <ResetPassword

        resetToken={resetToken}

        onBackToLogin={() => {

          window.history.replaceState(

            {},

            document.title,

            window.location.pathname

          );



          setScreen("login");

        }}

      />

    );

  }



  // Login

  if (screen === "login") {

    return (

      <Login

        onLogin={handleLogin}

        onShowSignup={() =>

          setScreen("signup")

        }

      />

    );

  }



  // Signup

  if (screen === "signup") {

    return (

      <Signup

        onSignup={handleSignup}

        onShowLogin={() =>

          setScreen("login")

        }

      />

    );

  }



  // Chat

  return (

    <ChatApp

      user={user || getSavedUser()}

      onLogout={handleLogout}

    />

  );

}



export default App;