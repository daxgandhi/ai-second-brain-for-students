# 🧠 AI Second Brain for Students

A full-stack web application that acts as an AI-powered study assistant for students. Built with HTML/CSS/JavaScript (frontend) and Node.js + Express + MongoDB (backend).

---

## 📁 Project Structure

```
ai-second-brain/
│
├── frontend/                  ← All HTML, CSS, JavaScript files
│   ├── index.html             ← Landing page
│   ├── login.html             ← Login page
│   ├── register.html          ← Registration page
│   ├── dashboard.html         ← User dashboard
│   ├── analytics.html         ← Study analytics dashboard
│   ├── chat.html              ← AI Chat interface
│   ├── exam-history.html      ← Past exam results
│   ├── exam.html              ← MCQ exam generator
│   ├── flashcards.html        ← AI-generated flashcards
│   ├── planner.html           ← Study planner
│   ├── rag.html               ← Chat with Notes (RAG)
│   ├── session.html           ← Study session tracker
│   ├── sidebar.html           ← Common sidebar component
│   ├── summary.html           ← Summary generator
│   ├── upload.html            ← Upload notes (PDF/text)
│   ├── css/
│   │   └── style.css          ← Global styles (dark theme)
│   └── js/
│       ├── analytics.js
│       ├── auth.js
│       ├── chat.js
│       ├── exam.js
│       ├── flashcards.js
│       ├── notes.js
│       ├── planner.js
│       ├── rag.js
│       ├── sessions.js
│       ├── summary.js
│       └── utils.js           ← Shared JS utilities
│
└── backend/                   ← Node.js Express server
    ├── server.js              ← Main entry point
    ├── test_auth_logic.js     ← Authentication test script
    ├── .env                   ← Environment variables
    ├── .env.example           ← Environment variables template
    ├── package.json
    ├── package-lock.json
    ├── middleware/
    │   └── auth.js            ← JWT authentication middleware
    ├── models/
    │   ├── ChatMessage.js     ← Chat history schema
    │   ├── ExamResult.js      ← Exam results schema
    │   ├── FlashcardDeck.js   ← Saved flashcard decks schema
    │   ├── Note.js            ← Notes/files schema
    │   ├── StudyPlan.js       ← Saved study plans schema
    │   ├── StudySession.js    ← Study session schema
    │   ├── SummaryHistory.js  ← Saved summary generations schema
    │   └── User.js            ← User schema
    ├── routes/
    │   ├── analytics.js       ← GET /analytics routes
    │   ├── auth.js            ← POST /register, POST /login, GET /me
    │   ├── chat.js            ← POST /chat routes
    │   ├── exam.js            ← POST /exam routes
    │   ├── flashcards.js      ← POST /flashcards, GET /history
    │   ├── notes.js           ← POST /upload, GET /, DELETE /:id
    │   ├── planner.js         ← POST /planner, GET /history
    │   ├── rag.js             ← POST /rag, GET /rag/history
    │   ├── sessions.js        ← Session tracking routes
    │   └── summary.js         ← POST /summary, GET /history
    ├── utils/
    │   └── ragUtils.js        ← RAG utility functions (ChromaDB/Embeddings)
    └── uploads/               ← Created automatically for PDF storage
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+ installed
- MongoDB installed and running (or MongoDB Atlas URI)

### Step 1: Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-second-brain
JWT_SECRET=your_secret_key_here
```

Start the server:
```bash
npm run dev    # Development (auto-restart)
# or
npm start      # Production
```

✅ Server runs at: `http://localhost:5000`

### Step 2: Open Frontend

Open `frontend/index.html` in your browser.

**Option A — Direct file open** (simplest):
- Double-click `index.html` in your file explorer

**Option B — Live Server (recommended for development)**:
- Install VS Code + Live Server extension
- Right-click `index.html` → "Open with Live Server"

**Option C — Simple HTTP server**:
```bash
cd frontend
npx serve .
# or
python -m http.server 8080
```

---

## 🔌 API Endpoints (Highlights)

| Method | Endpoint              | Auth | Description               |
|--------|-----------------------|------|---------------------------|
| POST   | /api/auth/register    | ❌   | Create new account        |
| POST   | /api/auth/login       | ❌   | Login + get JWT token     |
| GET    | /api/auth/me          | ✅   | Get current user info     |
| POST   | /api/notes/upload     | ✅   | Upload PDF or text note   |
| GET    | /api/notes            | ✅   | Get all user notes        |
| POST   | /api/chat             | ✅   | Send Standard chat message|
| POST   | /api/rag              | ✅   | Chat with Uploaded Notes  |
| GET    | /api/rag/history      | ✅   | Retrieve RAG chat history |
| POST   | /api/summary          | ✅   | Generate text summary     |
| GET    | /api/summary/history  | ✅   | Retrieve past summaries   |
| POST   | /api/exam             | ✅   | Generate MCQ/Papers       |
| GET    | /api/exam/history     | ✅   | Retrieve exam results     |
| POST   | /api/planner          | ✅   | Generate study plan       |
| GET    | /api/planner/history  | ✅   | Retrieve past plans       |
| POST   | /api/flashcards       | ✅   | Generate flashcards       |
| GET    | /api/flashcards/history| ✅  | Retrieve saved decks      |

---

## 🤖 AI Integration (Gemini-2.5-Flash)

This project has been fully upgraded to use the **Google Gemini-2.5-Flash** AI model for all generation tools. Features like Summaries, Exams, Flashcards, Planners, and RAG (Chat with Notes) rely on real AI generation rather than dummy responses!

### Option A: OpenAI

```bash
npm install openai
```

In `routes/chat.js`, replace `getDummyResponse()`:
```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: message }]
});
return completion.choices[0].message.content;
```

### Option B: Google Gemini

```bash
npm install @google/generative-ai
```

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const result = await model.generateContent(message);
return result.response.text();
```

Add your API key to `.env` for the tools to work:
```
GEMINI_API_KEY=AIza...
```

To run the RAG Features locally (Chat with Notes), ensure you are running an Ollama instance with `llama3` for embedded chunks generation, and a local ChromaDB instance on port 8000 handling vector storage.

---

## 🎨 Features

| Feature | Status | Notes |
|---------|--------|-------|
| User Auth | ✅ Complete | JWT auth, bcrypt hashing |
| Dashboard & Analytics | ✅ Complete | Dynamic stats + study hours tracking |
| Note Uploads | ✅ Complete | Parse and chunk PDF/Text (Store in MongoDB) |
| Standard Chat | ✅ Complete | Conversational Gemini AI (History saved) |
| Chat with Notes (RAG) | ✅ Complete | Vector search via ChromaDB + Ollama + Gemini |
| Show RAG Sources | ✅ Complete | Displays exact chunks/documents cited |
| Weak Topic Detection | ✅ Complete | Analyzes past quiz scores |
| Study Recommendation | ✅ Complete | AI-driven actionable study plans |
| Summary Generator | ✅ Complete | Summarize from text/notes (History saved) |
| Flashcards Generator| ✅ Complete | Interactive swipable Deck (History saved) |
| Exam/Paper Generator| ✅ Complete | Mid/End-Sem, MCQs (Results history saved) |
| Study Planner | ✅ Complete | Day-by-day AI schedule (History saved) |
| Responsive UI | ✅ Complete | Mobile sidebar + Dark Theme + CSS variables |

---

## 🛠️ Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript (no frameworks!)  
**Backend:** Node.js, Express.js  
**Database:** MongoDB with Mongoose ODM  
**Auth:** JWT (jsonwebtoken) + bcryptjs  
**File Upload:** Multer  
**Fonts:** Syne + DM Sans (Google Fonts)  

---

## 📝 Notes for Final Year Project

- All dummy AI responses are clearly marked with `// --- REPLACE WITH AI API CALL ---` comments
- Code is intentionally kept simple and well-commented for easy understanding
- Each file has a header comment explaining its purpose
- The project follows a clean MVC-like pattern

---

*Built as a Final Year Project — AI Second Brain for Students*
