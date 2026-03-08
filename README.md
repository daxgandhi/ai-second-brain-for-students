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
│   ├── chat.html              ← AI Chat interface
│   ├── upload.html            ← Upload notes (PDF/text)
│   ├── summary.html           ← Summary generator
│   ├── exam.html              ← MCQ exam generator
│   ├── planner.html           ← Study planner
│   ├── css/
│   │   └── style.css          ← Global styles (dark theme)
│   └── js/
│       └── utils.js           ← Shared JS utilities
│
└── backend/                   ← Node.js Express server
    ├── server.js              ← Main entry point
    ├── .env.example           ← Environment variables template
    ├── package.json
    ├── middleware/
    │   └── auth.js            ← JWT authentication middleware
    ├── models/
    │   ├── User.js            ← User schema (Mongoose)
    │   └── Note.js            ← Notes/files schema (Mongoose)
    ├── routes/
    │   ├── auth.js            ← POST /register, POST /login, GET /me
    │   ├── notes.js           ← POST /upload, GET /, DELETE /:id
    │   ├── chat.js            ← POST /chat
    │   ├── summary.js         ← POST /summary
    │   ├── exam.js            ← POST /exam
    │   └── planner.js         ← POST /planner
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

## 🔌 API Endpoints

| Method | Endpoint              | Auth | Description               |
|--------|-----------------------|------|---------------------------|
| POST   | /api/auth/register    | ❌   | Create new account        |
| POST   | /api/auth/login       | ❌   | Login + get JWT token     |
| GET    | /api/auth/me          | ✅   | Get current user info     |
| POST   | /api/notes/upload     | ✅   | Upload PDF or text note   |
| GET    | /api/notes            | ✅   | Get all user notes        |
| DELETE | /api/notes/:id        | ✅   | Delete a note             |
| POST   | /api/chat             | ✅   | Send chat message         |
| POST   | /api/summary          | ✅   | Generate text summary     |
| POST   | /api/exam             | ✅   | Generate MCQ questions    |
| POST   | /api/planner          | ✅   | Generate study plan       |

---

## 🤖 Connecting a Real AI (Next Steps)

The backend currently uses smart dummy responses. To connect a real AI:

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

Add your API key to `.env`:
```
OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=AIza...
```

---

## 🎨 Features

| Feature | Status | Notes |
|---------|--------|-------|
| User Registration | ✅ Complete | JWT auth, bcrypt hashing |
| User Login | ✅ Complete | Token expires in 7 days |
| Dashboard | ✅ Complete | Stats + recent notes |
| AI Chat | ✅ Complete | Dummy responses (swap with AI API) |
| PDF Upload | ✅ Complete | Multer, 10MB limit |
| Text Notes | ✅ Complete | Full CRUD |
| Summary Generator | ✅ Complete | Dummy (ready for AI API) |
| MCQ Exam Generator | ✅ Complete | Interactive quiz with scoring |
| Study Planner | ✅ Complete | Day-by-day timeline |
| Responsive UI | ✅ Complete | Mobile sidebar + responsive grid |
| Dark Theme | ✅ Complete | CSS variables-based |

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
