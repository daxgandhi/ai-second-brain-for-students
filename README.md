<p align="center">
  <img src="https://img.shields.io/badge/Cortex_AI-For_Students-6C63FF?style=for-the-badge&logo=brain&logoColor=white" alt="Cortex AI" />
</p>

<h1 align="center">🧠 Cortex AI — Intelligent Study Assistant</h1>

<p align="center">
  <strong>An AI-powered second brain that helps students store, understand, revise, and retain knowledge — built with modern AI, RAG, and learning science.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/ChromaDB-FF6F00?style=flat-square&logo=databricks&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-F55036?style=flat-square&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [How RAG Works](#-how-rag-works)
- [Spaced Repetition System](#-spaced-repetition-system-srs)
- [Demo Walkthrough](#-demo-walkthrough)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**Cortex AI** is a full-stack, AI-powered study platform designed to transform how students learn. It combines **Retrieval-Augmented Generation (RAG)**, **Spaced Repetition (SRS)**, and **adaptive AI tutoring** into a single cohesive system.

> **Why Cortex AI?**  
> Traditional study tools treat notes as static files. Cortex AI makes your notes *intelligent* — you can chat with them, generate exams from them, visualize their concepts as knowledge graphs, and get personalized revision schedules powered by learning science.

### What Students Can Do

- 📄 **Upload notes** (PDF or text) and have them processed, embedded, and indexed automatically
- 💬 **Chat with notes** using RAG — ask questions and get answers grounded in your own material
- 🗺️ **Visualize knowledge** through interactive concept graphs
- 🎓 **Learn step-by-step** with an adaptive AI tutor (Cortex Tutor)
- 📝 **Generate exams & quizzes** — including Parul University format papers
- 🃏 **Practice flashcards** with Anki-style spaced repetition
- 📊 **Track progress** with analytics dashboards and AI-driven study insights

---

## ✨ Key Features

| Feature | Description |
|:--------|:------------|
| **RAG Chat** | Context-aware Q&A powered by vector search over your notes |
| **Cortex Tutor** | Adaptive step-by-step AI teacher with curriculum generation, lessons, and evaluation |
| **Knowledge Graph** | Interactive visual map of concepts and their relationships |
| **Exam Generator** | AI-generated exam papers with configurable format and difficulty |
| **Flashcards + SRS** | Spaced repetition scheduling (Hard / Good / Easy) for long-term retention |
| **AI Smart Revision** | Identifies weak topics and generates actionable study recommendations |
| **Study Planner** | Daily study scheduling with task management |
| **Analytics Dashboard** | Visual tracking of study sessions, performance trends, and progress |
| **Multi-LLM Support** | Seamless fallback between Gemini, Groq, and Ollama providers |
| **Secure Auth** | JWT-based authentication with bcrypt password hashing |

---

## 🏛️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vanilla JS)                     │
│  Dashboard │ Chat │ Tutor │ Exams │ Flashcards │ Knowledge Graph │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
│                                                                  │
│  Auth ─── Notes ─── Sessions ─── Analytics ─── Study Planner    │
│                           │                                      │
│                    Python AI Client                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP (port 8001)
┌──────────────────────────▼───────────────────────────────────────┐
│               AI SERVICE (Python + FastAPI)                       │
│                                                                  │
│  RAG ─── Chat ─── Tutor ─── Exams ─── Flashcards ─── Summary   │
│  Knowledge Graph ─── Recommendations ─── Planner ─── Tasks      │
│                           │                                      │
│              ┌────────────┼────────────┐                        │
│              ▼            ▼            ▼                        │
│          Gemini AI    Groq API     Ollama                       │
│          (Primary)   (Fallback)   (Local)                       │
└──────────────────────────┬───────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
         MongoDB                   ChromaDB
      (Application Data)       (Vector Embeddings)
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| HTML5 / CSS3 / JavaScript | Core UI with responsive design |
| D3.js / Force Graph | Knowledge graph visualization |
| Chart.js | Analytics and performance charts |

### Backend (Node.js Gateway)
| Technology | Purpose |
|:-----------|:--------|
| Express.js | REST API framework |
| Mongoose | MongoDB ODM |
| JWT + bcrypt | Authentication & security |
| Multer | File upload handling |
| pdf-parse | PDF text extraction |

### AI Microservice (Python)
| Technology | Purpose |
|:-----------|:--------|
| FastAPI | High-performance async API |
| Google Gemini API | Primary LLM provider |
| Groq API | Fallback LLM (LLaMA 3.1) |
| Sentence Transformers | Text embeddings |
| ChromaDB | Vector database for RAG |
| PyPDF | Document processing |

### Infrastructure
| Technology | Purpose |
|:-----------|:--------|
| MongoDB | Primary database |
| ChromaDB | Vector store for embeddings |
| Ollama (optional) | Local LLM inference |

---

## 📁 Project Structure

```
cortex-ai/
│
├── frontend/                    # Client-side application
│   ├── index.html               # Landing page
│   ├── login.html               # Authentication - Login
│   ├── register.html            # Authentication - Register
│   ├── dashboard.html           # Main dashboard
│   ├── chat.html                # AI chat interface
│   ├── rag.html                 # Chat with notes (RAG)
│   ├── cortex-tutor.html        # Adaptive AI tutor
│   ├── knowledge-graph.html     # Interactive concept graph
│   ├── exam.html                # Exam generator
│   ├── exam-history.html        # Past exam results
│   ├── flashcards.html          # Flashcards with SRS
│   ├── summary.html             # Note summarization
│   ├── upload.html              # File upload interface
│   ├── planner.html             # Study planner
│   ├── analytics.html           # Analytics dashboard
│   ├── session.html             # Study session tracker
│   ├── css/                     # Stylesheets
│   │   ├── style.css            # Global styles
│   │   └── auth.css             # Authentication pages
│   └── js/                      # Client-side scripts
│
├── backend/                     # Node.js API gateway
│   ├── server.js                # Express server entry point
│   ├── routes/                  # API route handlers
│   │   ├── auth.js              # Authentication (register/login)
│   │   ├── notes.js             # Note CRUD & upload
│   │   ├── chat.js              # General AI chat
│   │   ├── rag.js               # RAG-powered Q&A
│   │   ├── tutor.js             # Cortex Tutor sessions
│   │   ├── exam.js              # Exam generation
│   │   ├── flashcards.js        # Flashcard management + SRS
│   │   ├── knowledgeGraph.js    # Knowledge graph generation
│   │   ├── summary.js           # Note summarization
│   │   ├── planner.js           # Study planning
│   │   ├── analytics.js         # Analytics & insights
│   │   └── sessions.js          # Study session tracking
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Note.js
│   │   ├── ChatMessage.js
│   │   ├── ExamResult.js
│   │   ├── FlashcardDeck.js
│   │   ├── KnowledgeGraph.js
│   │   ├── StudyPlan.js
│   │   ├── StudySession.js
│   │   ├── StudyInsight.js
│   │   ├── SummaryHistory.js
│   │   └── TutorSession.js
│   ├── middleware/               # Auth middleware (JWT)
│   └── utils/                   # Helper utilities
│       └── pythonAiClient.js    # HTTP client for AI service
│
├── ai-service/                  # Python AI microservice
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings & environment
│   │   ├── routers/             # API endpoints
│   │   │   ├── chat.py
│   │   │   ├── document.py
│   │   │   ├── exam.py
│   │   │   ├── flashcards.py
│   │   │   ├── knowledge_graph.py
│   │   │   ├── planner.py
│   │   │   ├── rag.py
│   │   │   ├── recommendation.py
│   │   │   ├── summary.py
│   │   │   ├── tasks.py
│   │   │   ├── tutor.py
│   │   │   └── health.py
│   │   ├── services/            # Business logic
│   │   ├── schemas/             # Pydantic models
│   │   ├── prompts/             # LLM prompt templates
│   │   ├── embeddings/          # Embedding utilities
│   │   ├── rag/                 # RAG pipeline
│   │   ├── chromadb/            # Vector DB integration
│   │   └── core/                # Logging & exceptions
│   └── requirements.txt         # Python dependencies
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| Node.js | ≥ 18.x |
| Python | ≥ 3.10 |
| MongoDB | ≥ 6.0 (local or Atlas) |
| ChromaDB | ≥ 0.4.x |
| Git | Latest |

### 1. Clone the Repository

```bash
git clone https://github.com/daxgandhi/ai-second-brain-for-students.git
cd ai-second-brain-for-students
```

### 2. Set Up the Backend (Node.js)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)
```

Start the backend server:

```bash
npm run dev
```

> The backend runs on `http://localhost:5000` by default.

### 3. Set Up the AI Service (Python)

```bash
cd ai-service
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

Start the AI service:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

> The AI service runs on `http://localhost:8001` by default.

### 4. Launch the Frontend

Open `frontend/index.html` in your browser, or use VS Code **Live Server** extension for hot reloading.

> **Tip:** The backend serves the frontend statically, so you can also access it at `http://localhost:5000` after starting the backend.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-second-brain
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### AI Service (`ai-service/.env`)

```env
# Server
PORT=8001
HOST=0.0.0.0
ENV=development

# LLM Provider (auto | gemini | groq | ollama)
AI_PROVIDER=auto
AI_PROVIDER_ORDER=gemini,groq

# Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Groq (Fallback)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Ollama (Local, Optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# ChromaDB
CHROMADB_URL=http://localhost:8000
CHROMADB_COLLECTION=notes_collection
```

> ⚠️ **Never commit `.env` files.** Both are included in `.gitignore`.

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |

### Notes Management

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/notes/upload` | Upload PDF or text notes |
| `GET` | `/api/notes` | Retrieve all user notes |
| `DELETE` | `/api/notes/:id` | Delete a specific note |

### AI & Learning

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/chat` | General AI conversation |
| `POST` | `/api/rag` | RAG-powered Q&A over notes |
| `POST` | `/api/summary` | Generate note summaries |
| `POST` | `/api/knowledge-graph` | Generate concept knowledge graph |

### Cortex Tutor

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/cortex-tutor/curriculum` | Generate learning curriculum |
| `POST` | `/api/cortex-tutor/lesson` | Get a lesson for a specific topic |
| `POST` | `/api/cortex-tutor/question` | Generate evaluation questions |
| `POST` | `/api/cortex-tutor/evaluate` | Evaluate student answers |

### Assessment & Practice

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/exam` | Generate exam papers |
| `POST` | `/api/flashcards` | Generate flashcard decks |
| `POST` | `/api/flashcards/:deckId/review/:cardId` | Submit SRS rating for a card |

### Analytics & Planning

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/analytics` | Fetch study analytics |
| `GET` | `/api/analytics/insights` | Get AI-powered study insights |
| `POST` | `/api/planner` | Create study plan |
| `POST` | `/api/sessions` | Log a study session |

### Health Check

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/health` | Backend health status |

---

## 🔎 How RAG Works

Cortex AI implements **Retrieval-Augmented Generation** to provide answers grounded in the student's own notes:

```
                    ┌─────────────┐
                    │  User Query │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Embed Query │  (Sentence Transformers)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Vector Search│  (ChromaDB)
                    │  Top-K Chunks│
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │   Augmented Prompt       │
              │   Query + Retrieved Chunks│
              └────────────┬────────────┘
                           │
                    ┌──────▼──────┐
                    │   LLM (Gemini)│
                    │  Generate Answer│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Grounded    │
                    │  Response    │
                    └─────────────┘
```

**Pipeline:**
1. Student uploads notes → text extracted (PDF parsing / OCR)
2. Text chunked and converted to vector embeddings
3. Embeddings stored in ChromaDB
4. On query: user question → embedded → similarity search → top relevant chunks retrieved
5. Chunks + question sent to LLM → generates an answer **grounded in the student's notes**

---

## 🧠 Spaced Repetition System (SRS)

Flashcards use an **Anki-inspired spaced repetition algorithm** to optimize long-term memory retention:

| Rating | Multiplier | Effect |
|:-------|:-----------|:-------|
| **Hard** | ×1 | Card reviewed again soon (more practice needed) |
| **Good** | ×2 | Card interval doubles (progressing well) |
| **Easy** | ×3 | Card interval triples (mastered, seen less often) |

The system automatically:
- Schedules cards based on performance history
- Surfaces weak concepts more frequently
- Reduces review load for mastered material

> This approach is backed by cognitive science research on the **forgetting curve** and **active recall**.

---

## 🎯 Demo Walkthrough

| Step | Action | Feature |
|:-----|:-------|:--------|
| 1 | Register & Login | Secure JWT authentication |
| 2 | Upload Notes | PDF/text processing & embedding |
| 3 | Explore Knowledge Graph | Visual concept mapping |
| 4 | Chat with Notes | RAG-powered Q&A |
| 5 | Learn with Cortex Tutor | Adaptive step-by-step lessons |
| 6 | Generate Exam | AI-created exam papers |
| 7 | Practice Flashcards | SRS-enhanced revision |
| 8 | Review Analytics | Performance insights & recommendations |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure your code follows the existing project structure and includes appropriate documentation.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🎓 About

This project was developed as a **B.Tech Final Year Project** demonstrating expertise in:

- Full-stack web application development
- AI/ML integration and prompt engineering
- Retrieval-Augmented Generation (RAG) systems
- Microservice architecture
- Learning optimization through spaced repetition

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/daxgandhi">Dax Gandhi</a></strong>
</p>

<p align="center">
  <a href="https://github.com/daxgandhi/ai-second-brain-for-students">
    <img src="https://img.shields.io/badge/⭐_Star_this_repo-6C63FF?style=for-the-badge" alt="Star this repo" />
  </a>
</p>
