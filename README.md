# 🧠 AI Second Brain for Students

A full-stack AI-powered study assistant that helps students **store, understand, revise, and retain knowledge efficiently** using modern AI techniques like **RAG (Retrieval-Augmented Generation)** and **Spaced Repetition (SRS)**.

---

## 🚀 Overview

This project is designed as a **personalized learning system** where students can:

* Upload notes (PDF/Text)
* Ask questions based on their notes (RAG)
* Generate quizzes and exam papers
* Practice flashcards with spaced repetition
* Track weak topics and get recommendations

> 💡 This system combines **AI + Retrieval + Learning Science** to improve both understanding and long-term memory.

---

## 🔥 Key Highlights

* 🤖 Gemini AI Integration (real AI responses)
* 🔎 Retrieval-Augmented Generation (RAG)
* 🧠 Spaced Repetition System (Anki-style)
* 📊 Weak Topic Detection & Study Recommendations
* 📝 Exam & Quiz Generator (Parul University format)
* 📚 Chat with Notes (Context-aware responses)
* 📈 Analytics Dashboard (study tracking)

---

## 🎯 Demo Flow

1. Register / Login
2. Upload Notes (PDF/Text)
3. Chat with Notes (RAG)
4. Generate Quiz / Exam
5. Practice Flashcards (SRS Mode)
6. View Analytics & Weak Topics

---

## 🏗️ Project Structure

```
ai-second-brain/
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── chat.html
│   ├── exam.html
│   ├── flashcards.html
│   ├── planner.html
│   ├── rag.html
│   ├── summary.html
│   ├── upload.html
│   └── js/
│
└── backend/
    ├── server.js
    ├── models/
    ├── routes/
    ├── middleware/
    ├── utils/
    └── uploads/
```

---

## ⚙️ Tech Stack

**Frontend:** HTML, CSS, JavaScript
**Backend:** Node.js, Express.js
**Database:** MongoDB (Mongoose)
**AI:** Google Gemini API
**RAG:** ChromaDB + Embeddings (Ollama)
**Auth:** JWT + bcrypt
**File Upload:** Multer

---

## 🤖 AI & RAG System

The system implements **Retrieval-Augmented Generation (RAG)**:

1. Notes are uploaded and processed
2. Text is converted into embeddings
3. Stored in ChromaDB (vector database)
4. User query → converted to embedding
5. Top relevant chunks retrieved
6. Sent to Gemini AI → generates answer

👉 This ensures **accurate and context-based responses**

---

## 🧠 Spaced Repetition System (SRS)

Flashcards are enhanced with **Anki-style learning**:

* Users rate cards: **Hard / Good / Easy**
* System schedules next review based on performance
* Weak concepts appear more frequently

👉 Improves **long-term retention using memory science**

---

## 📊 Features

| Feature              | Description                      |
| -------------------- | -------------------------------- |
| User Authentication  | Secure login using JWT           |
| Notes Upload         | Upload and manage PDF/Text notes |
| Chat with Notes      | Ask questions using RAG          |
| Quiz Generator       | MCQ-based testing                |
| Exam Generator       | Parul University format papers   |
| Flashcards + SRS     | Smart revision system            |
| Study Planner        | Daily study scheduling           |
| Analytics Dashboard  | Track performance & progress     |
| Weak Topic Detection | Identify weak areas              |
| Study Recommendation | AI-based suggestions             |

---

## 🔌 API Endpoints (Highlights)

| Method | Endpoint                               | Description         |
| ------ | -------------------------------------- | ------------------- |
| POST   | /api/auth/register                     | Register user       |
| POST   | /api/auth/login                        | Login               |
| POST   | /api/notes/upload                      | Upload notes        |
| GET    | /api/notes                             | Get notes           |
| POST   | /api/chat                              | AI chat             |
| POST   | /api/rag                               | Chat with notes     |
| POST   | /api/exam                              | Generate exam       |
| POST   | /api/flashcards                        | Generate flashcards |
| POST   | /api/flashcards/:deckId/review/:cardId | SRS rating          |

---

## 🚀 Setup & Run

### 1️⃣ Backend

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env`:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_api_key
```

Run server:

```bash
npm run dev
```

---

### 2️⃣ Frontend

Open:

```
frontend/index.html
```

OR use Live Server

---

## ⚠️ Notes

* `.env` file is not included for security reasons
* RAG uses local setup (Ollama + ChromaDB)
* Can be extended with cloud vector DB (Pinecone)

---

## 🎓 Final Year Project

This project was developed as a **B.Tech Final Year Project** to demonstrate:

* Full-stack development
* AI integration
* Retrieval-based systems
* Learning optimization techniques

---

## 🏆 Conclusion

This is not just a chatbot —
it is a **complete AI-powered learning system** that helps students:

✔ Understand concepts
✔ Practice actively
✔ Retain knowledge long-term

---

*Built with focus on real-world learning problems 🚀*

