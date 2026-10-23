import React, { useState } from "react";
import "../LandingPage.css";
import InteractiveMascot from "../components/InteractiveMascot";

const FAQ_ITEMS = [
  {
    id: 1,
    question: "What is LDRP-AI?",
    answer:
      "LDRP-AI is a RAG-based academic assistant designed specifically for LDRP-ITR students. It provides instant, accurate answers about college information, Syllabus, course subjects, exam structures, notices, and faculty resources using verified institutional data.",
  },
  {
    id: 2,
    question: "What kind of questions can I ask?",
    answer:
      "You can ask about semester credit distributions, specific subject details (like MCA-37 or Software Testing), exam timetables, academic circulars, campus facilities, admission procedures, and study material recommendations.",
  },
  {
    id: 3,
    question: "Where does the information come from?",
    answer:
      "All responses are grounded in official LDRP-ITR college handbooks, verified syllabus PDFs, official circulars, and departmental resources using Retrieval-Augmented Generation (RAG). Every answer links to verified context so you can trust the details.",
  },
  {
    id: 4,
    question: "Is LDRP-AI free for students?",
    answer:
      "Yes, LDRP-AI is completely free for all enrolled LDRP-ITR students and faculty members. Simply sign up with your college email to get direct access to the assistant.",
  },
  {
    id: 5,
    question: "When will access be available?",
    answer:
      "Access is open right now! You can sign up immediately to start chatting with the assistant or sign in with your existing account.",
  },
];

export default function LandingPage({
  user,
  onNavigateLogin,
  onNavigateSignup,
  onNavigateChat,
}) {
  const [openFaqId, setOpenFaqId] = useState(1);

  // Check if an account already exists on this browser / device
  const [hasExistingAccount] = useState(() => {
    try {
      return Boolean(
        user ||
        localStorage.getItem("has_account") === "true" ||
        localStorage.getItem("user") ||
        localStorage.getItem("access_token")
      );
    } catch {
      return Boolean(user);
    }
  });

  const toggleFaq = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="ldrp-landing">
      {/* ====================================================================
          1. Header (Clean Borderless Layout: Far Left Brand, Far Right Actions)
          ==================================================================== */}
      <header className="landing-header">
        <div className="header-container">
          {/* Left Zone: Brand Lockup */}
          <div className="header-left">
            <button
              type="button"
              className="landing-brand"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className="brand-icon-wrapper">
                <img
                  src="/logo.webp"
                  alt="LDRP-AI Logo"
                  className="brand-icon"
                />
              </div>
              <span className="brand-title">LDRP-AI</span>
            </button>
          </div>

          {/* Right Zone: Features, How it works, About, FAQ, GitHub + Capsule Button */}
          <div className="header-right">
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection("features")}
            >
              Features
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection("how-it-works")}
            >
              How it works
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection("about")}
            >
              About
            </button>
            <button
              type="button"
              className="nav-link"
              onClick={() => scrollToSection("faq")}
            >
              FAQ
            </button>
            <a
              href="https://github.com/smitzzz07/RAG_based_LDRP_chatbox-"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link nav-github-link"
              title="View on GitHub"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. Hero Section
          ==================================================================== */}
      <main>
        <section id="hero-section" className="hero-section">
          {/* Expansive Ambient Behind-Mascot Glow Covering Entire Hero */}
          <div className="hero-behind-mascot-glow" aria-hidden="true" />

          <div className="hero-content">
            <h1 className="hero-headline">
              Meet LDRP-AI
            </h1>
            <p className="hero-subheadline">
              Your AI academic assistant for LDRP-ITR.
              <br />
              Get instant answers from college information,<br /> resources,
              notices, syllabus and more.
            </p>

            {/* Pill-shaped Action Buttons conditioned on user session/account */}
            <div className="hero-cta-group">
              {user ? (
                /* Active Session: Continue to Chat */
                <button
                  type="button"
                  className="hero-pill-btn-primary"
                  onClick={onNavigateChat}
                >
                  <span>Continue to Chat</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              ) : hasExistingAccount ? (
                /* User already created an account: Show ONLY Sign In */
                <button
                  type="button"
                  className="hero-pill-btn-primary"
                  onClick={onNavigateLogin}
                >
                  <span>Sign In</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              ) : (
                /* New user: Show BOTH Sign Up and Sign In */
                <>
                  <button
                    type="button"
                    className="hero-pill-btn-primary"
                    onClick={() => onNavigateSignup && onNavigateSignup("")}
                  >
                    <span>Sign Up</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="hero-pill-btn-secondary"
                    onClick={onNavigateLogin}
                  >
                    <span>Sign In</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ================================================================
              3. Mascot Visual & Floating Badges
              ================================================================ */}
          <div id="features-section" className="mascot-stage">
            {/* Background Glow */}
            <div className="mascot-ambient-glow" />

            {/* Orbit curve line */}
            <svg
              className="mascot-orbit-svg"
              viewBox="0 0 960 420"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 60 400 C 140 80, 820 80, 900 400"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1.5"
                strokeDasharray="6 6"
              />
            </svg>

            {/* Orbiting Badges */}
            <div className="feature-badge badge-pos-1">
              <span className="feature-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span>College Information</span>
            </div>

            <div className="feature-badge badge-pos-2">
              <span className="feature-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span>Syllabus & Subjects</span>
            </div>

            <div className="feature-badge badge-pos-3">
              <span className="feature-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </span>
              <span>Notices & Updates</span>
            </div>

            <div className="feature-badge badge-pos-4">
              <span className="feature-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </span>
              <span>Source-backed Answers</span>
            </div>

            {/* Rising Interactive Mascot Character with Cursor Following & Blinking */}
            <div className="mascot-character-wrapper">
              <InteractiveMascot />
            </div>
          </div>
        </section>

        {/* ====================================================================
            4. Features Section
            ==================================================================== */}
        <section id="features" className="content-section features-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-eyebrow">CAPABILITIES</span>
              <h2 className="section-headline">
                Intelligent Academic Assistance, <br />
                <span className="text-gradient">Grounded in Institutional Truth.</span>
              </h2>
              <p className="section-subheadline">
                Trained on official LDRP-ITR handbooks, Syllabus, faculty directories,
                and academic schedules to deliver verifiable answers in seconds.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  </div>
                  <span className="feature-tag">CURRICULUM</span>
                </div>
                <h3 className="feature-card-title">Syllabus & Credit Schemes</h3>
                <p className="feature-card-desc">
                  Detailed subject unit breakdowns, weekly lecture/lab hour allocations,
                  and evaluation schemes directly parsed from verified KSV circulars.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <span className="feature-tag">DATA PIPELINE</span>
                </div>
                <h3 className="feature-card-title">High-Fidelity Document Ingestion</h3>
                <p className="feature-card-desc">
                  Powered by PyMuPDF document extraction and text normalizers that preserve complex tables,
                  faculty tables, and course prerequisites without formatting loss.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  <span className="feature-tag">SEMANTIC SEARCH</span>
                </div>
                <h3 className="feature-card-title">Sub-Second FAISS Vector Search</h3>
                <p className="feature-card-desc">
                  Dense 384-dimensional vector embeddings generated using sentence-transformers,
                  stored in a local FAISS index for lightning-fast similarity lookups.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <span className="feature-tag">ANTI-HALLUCINATION</span>
                </div>
                <h3 className="feature-card-title">Grounded Answers & Citations</h3>
                <p className="feature-card-desc">
                  Every answer references official institutional files with transparent source citations
                  and page numbers so students can verify facts independently.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <span className="feature-tag">STUDENT WORKSPACE</span>
                </div>
                <h3 className="feature-card-title">Student PDF Upload & Chat</h3>
                <p className="feature-card-desc">
                  Upload your own project guidelines, syllabus annexures, or study notes into
                  an ephemeral session for instant, private question-answering.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card-header">
                  <div className="feature-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <span className="feature-tag">CAMPUS INTEL</span>
                </div>
                <h3 className="feature-card-title">Faculty Directory & Calendar</h3>
                <p className="feature-card-desc">
                  Instant lookups for Director & HOD contacts, department cabins,
                  official email addresses, and the official KSV 2026 holiday schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            5. How It Works Section
            ==================================================================== */}
        <section id="how-it-works" className="content-section how-it-works-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-eyebrow">ARCHITECTURE</span>
              <h2 className="section-headline">
                From Raw Document to Cited Answer <br />
                <span className="text-gradient">in Four Engineered Stages.</span>
              </h2>
              <p className="section-subheadline">
                Built with a clean Python RAG stack designed specifically for accuracy,
                verifiability, and zero hallucination.
              </p>
            </div>

            <div className="pipeline-steps-grid">
              <div className="pipeline-step-card">
                <div className="pipeline-step-number">01</div>
                <div className="pipeline-step-tag">INGESTION & CLEANING</div>
                <h3 className="pipeline-step-title">Multi-Source Extraction</h3>
                <p className="pipeline-step-desc">
                  College handbooks, Syllabus, and administrative records are ingested via PyMuPDF.
                  Header/footer artifacts are stripped and normalized.
                </p>
                <div className="pipeline-step-pill">rag/loader.py & cleaner.py</div>
              </div>

              <div className="pipeline-step-card">
                <div className="pipeline-step-number">02</div>
                <div className="pipeline-step-tag">CHUNKING</div>
                <h3 className="pipeline-step-title">Semantic Context Windows</h3>
                <p className="pipeline-step-desc">
                  Text is partitioned into balanced semantic windows with overlapping boundaries,
                  preserving course tables, unit titles, and evaluation criteria.
                </p>
                <div className="pipeline-step-pill">rag/chunker.py</div>
              </div>

              <div className="pipeline-step-card">
                <div className="pipeline-step-number">03</div>
                <div className="pipeline-step-tag">EMBEDDINGS & FAISS</div>
                <h3 className="pipeline-step-title">Dense Vector Indexing</h3>
                <p className="pipeline-step-desc">
                  Chunks are transformed into 384-dimensional dense vectors using SentenceTransformers
                  and indexed in an ultra-fast local FAISS vector space.
                </p>
                <div className="pipeline-step-pill">rag/vector_store.py</div>
              </div>

              <div className="pipeline-step-card">
                <div className="pipeline-step-number">04</div>
                <div className="pipeline-step-tag">RETRIEVAL & SYNTHESIS</div>
                <h3 className="pipeline-step-title">Grounded Generation</h3>
                <p className="pipeline-step-desc">
                  When a query arrives, top-k relevant passages are retrieved and formatted into
                  a strict context prompt for the LLM with direct page citations.
                </p>
                <div className="pipeline-step-pill">rag/retriever.py & llm.py</div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            6. About Section
            ==================================================================== */}
        <section id="about" className="content-section about-section">
          <div className="section-container">
            <div className="about-grid">
              {/* Left Column: Institutional Mission */}
              <div className="about-left">
                <span className="section-eyebrow">ABOUT THE PROJECT</span>
                <h2 className="section-headline">
                  Dedicated to LDRP-ITR <br />
                  <span className="text-gradient">Students & Faculty.</span>
                </h2>
                <p className="about-desc">
                  LDRP Institute of Technology and Research (Gandhinagar), constituent of
                  Kadi Sarva Vishwavidyalaya (KSV), fosters excellence in engineering and
                  computer applications.
                </p>
                <p className="about-desc">
                  Finding specific syllabus credits, examination rules, or faculty contacts
                  often meant navigating disparate PDF files. LDRP-AI resolves this by
                  offering a single, source-grounded conversational assistant.
                </p>

                <div className="about-metrics-row">
                  <div className="metric-box">
                    <span className="metric-num">100%</span>
                    <span className="metric-lbl">Source Grounded</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-num">LDRP-ITR</span>
                    <span className="metric-lbl">Full Curriculum</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-num">FAISS</span>
                    <span className="metric-lbl">Vector Engine</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-num">&lt; 2s</span>
                    <span className="metric-lbl">Answer Latency</span>
                  </div>
                </div>
              </div>

              {/* Right Column: GitHub Repository Showcase */}
              <div className="about-right">
                <div className="github-card">
                  <div className="github-card-top">
                    <div className="github-icon-title">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      <div>
                        <div className="github-repo-name">smitzzz07/RAG_based_LDRP_chatbox-</div>
                        <span className="github-tagline">Open-source Academic Assistant</span>
                      </div>
                    </div>
                    <span className="github-badge">Public</span>
                  </div>

                  <p className="github-card-desc">
                    Retrieval-Augmented Generation chatbot built for LDRP-ITR. Features modular
                    loaders, chunking with overlap, dense vector search, FastAPI endpoints,
                    and interactive React UI.
                  </p>

                  <div className="github-tech-tags">
                    <span className="tech-tag">Python 3.11</span>
                    <span className="tech-tag">FastAPI</span>
                    <span className="tech-tag">FAISS</span>
                    <span className="tech-tag">SentenceTransformers</span>
                    <span className="tech-tag">PyMuPDF</span>
                    <span className="tech-tag">React + Vite</span>
                  </div>

                  <a
                    href="https://github.com/smitzzz07/RAG_based_LDRP_chatbox-"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-cta-btn"
                  >
                    <span>View Repository on GitHub</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            7. FAQ Section
            ==================================================================== */}
        <section id="faq" className="faq-section">
          <div className="faq-container">
            {/* Left Column (40%) */}
            <div className="faq-left">
              <span className="faq-eyebrow">FAQ</span>
              <h2 className="faq-headline-white">Questions?</h2>
              <h2 className="faq-headline-dim">We have answers.</h2>

              <div className="faq-contact-box">
                Anything else? Write to{" "}
                <br />
                <a
                  href="mailto:hello@ldrp-ai.in"
                  className="faq-contact-email"
                >
                  hello@ldrp-ai.in
                </a>
              </div>
            </div>

            {/* Right Column (60%): Accordion */}
            <div className="faq-right">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div key={item.id} className="faq-item">
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleFaq(item.id)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.question}</span>
                      <span
                        className={`faq-toggle-icon ${
                          isOpen ? "open" : "closed"
                        }`}
                      >
                        {isOpen ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        )}
                      </span>
                    </button>

                    <div
                      className="faq-answer-wrapper"
                      style={{
                        maxHeight: isOpen ? "240px" : "0px",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <p className="faq-answer-text">{item.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          8. Footer
          ==================================================================== */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="footer-brand">
                <img
                  src="/logo.webp"
                  alt="LDRP-AI Logo"
                  className="footer-logo"
                />
                <span className="footer-brand-title">LDRP-AI</span>
              </div>
              <p className="footer-tagline">
                Your AI academic assistant for LDRP-ITR.
              </p>
            </div>

            <div className="footer-nav-links">
              <button
                type="button"
                className="footer-link"
                onClick={() => scrollToSection("features")}
              >
                Features
              </button>
              <button
                type="button"
                className="footer-link"
                onClick={() => scrollToSection("how-it-works")}
              >
                How it works
              </button>
              <button
                type="button"
                className="footer-link"
                onClick={() => scrollToSection("about")}
              >
                About
              </button>
              <button
                type="button"
                className="footer-link"
                onClick={() => scrollToSection("faq")}
              >
                FAQ
              </button>
              <a
                href="https://github.com/smitzzz07/RAG_based_LDRP_chatbox-"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link footer-github-link"
                title="View on GitHub"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
              {user ? (
                <button
                  type="button"
                  className="footer-link footer-auth-link"
                  onClick={onNavigateChat}
                >
                  Open Chat
                </button>
              ) : hasExistingAccount ? (
                <button
                  type="button"
                  className="footer-link footer-auth-link"
                  onClick={onNavigateLogin}
                >
                  Sign In
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="footer-link footer-auth-link"
                    onClick={onNavigateLogin}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="footer-link footer-auth-link"
                    onClick={() => onNavigateSignup && onNavigateSignup("")}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="footer-bottom-row">
            <span>© 2026 LDRP-AI</span>
            <button
              type="button"
              className="footer-cookie-btn"
              onClick={() => alert("Cookie settings: Strictly necessary cookies only.")}
            >
              Cookie settings
            </button>
          </div>
        </div>

        {/* ====================================================================
            6. Signature Close (Giant Cropped Wordmark)
            ==================================================================== */}
        <div className="signature-close" aria-hidden="true">
          <div className="signature-radial-glow" />
          <span className="signature-wordmark">LDRP-AI</span>
        </div>
      </footer>
    </div>
  );
}
