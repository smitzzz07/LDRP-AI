import React, { useState } from "react";
import "../LandingPage.css";
import InteractiveMascot from "../components/InteractiveMascot";
import HeroCosmicBackdrop from "../components/HeroCosmicBackdrop";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Lightning,
  BellSimple,
  BookmarkSimple,
  BookOpenText,
  Pulse,
  MagnifyingGlass,
  ShieldCheck,
  FileArrowUp,
  UsersFour,
  Plus,
  Minus,
} from "@phosphor-icons/react";

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
              <img
                src="https://cdn.simpleicons.org/github/white"
                alt="GitHub"
                width="16"
                height="16"
                className="nav-github-icon"
                loading="lazy"
              />
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
          {/* Animated Stars and Floating Atmospheric Clouds */}
          <HeroCosmicBackdrop />

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
                  <ArrowRight size={16} weight="bold" />
                </button>
              ) : hasExistingAccount ? (
                /* User already created an account: Show ONLY Sign In */
                <button
                  type="button"
                  className="hero-pill-btn-primary"
                  onClick={onNavigateLogin}
                >
                  <span>Sign In</span>
                  <ArrowRight size={16} weight="bold" />
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
                    <ArrowRight size={16} weight="bold" />
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
                <GraduationCap size={16} weight="bold" />
              </span>
              <span>College Information</span>
            </div>

            <div className="feature-badge badge-pos-2">
              <span className="feature-badge-icon">
                <Lightning size={16} weight="bold" />
              </span>
              <span>Syllabus & Subjects</span>
            </div>

            <div className="feature-badge badge-pos-3">
              <span className="feature-badge-icon">
                <BellSimple size={16} weight="bold" />
              </span>
              <span>Notices & Updates</span>
            </div>

            <div className="feature-badge badge-pos-4">
              <span className="feature-badge-icon">
                <BookmarkSimple size={16} weight="bold" />
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
                    <BookOpenText size={22} weight="bold" />
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
                    <Pulse size={22} weight="bold" />
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
                    <MagnifyingGlass size={22} weight="bold" />
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
                    <ShieldCheck size={22} weight="bold" />
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
                    <FileArrowUp size={22} weight="bold" />
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
                    <UsersFour size={22} weight="bold" />
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
                Raw Document to Cited Answer <br />
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
                      <img
                        src="https://cdn.simpleicons.org/github/white"
                        alt="GitHub"
                        width="28"
                        height="28"
                        className="github-card-logo"
                        loading="lazy"
                      />
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
                    <ArrowUpRight size={16} weight="bold" />
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
                          <Minus size={14} weight="bold" />
                        ) : (
                          <Plus size={14} weight="bold" />
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
                <img
                  src="https://cdn.simpleicons.org/github/white"
                  alt="GitHub"
                  width="16"
                  height="16"
                  className="footer-github-icon"
                  loading="lazy"
                />
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
