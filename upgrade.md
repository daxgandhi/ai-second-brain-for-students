# ?? Cortex AI — Upgrade Ideas for Final Year Project (v2.0)

## What You Already Have (v1.0 Summary)

| Feature | Tech | Status |
|---|---|---|
| User Auth (JWT + bcrypt) | Node/Express/MongoDB | ? |
| Upload Notes (PDF + Text) | Multer + pdf-parse | ? |
| AI Chat (Standard) | Gemini 2.5 Flash | ? |
| Chat with Notes (RAG) | ChromaDB + Ollama + Gemini | ? |
| Summary Generator | Gemini | ? |
| Flashcards + SRS (SM-2) | Gemini + MongoDB | ? |
| Exam Generator (MCQ + Mid/End Sem Papers) | Gemini + Ollama fallback | ? |
| Study Planner | Gemini | ? |
| Study Timer / Sessions | MongoDB | ? |
| Analytics Dashboard | Chart.js + MongoDB Aggregation | ? |
| Weak Topic Detection | MongoDB Aggregation | ? |
| AI Study Recommendations | Gemini | ? |

> Your v1.0 is already **very solid** — it has real AI integration (not dummy), a RAG pipeline, SRS algorithm, and analytics. The upgrade ideas below are chosen to add **novelty, depth, and "wow factor"** that will impress evaluators.

---

## ?? Tier 1 — HIGH IMPACT Features (Pick 2-3 of these)

These are the features that will **make or break** your viva. They add real academic novelty.

---

### 1. ?? AI-Powered Knowledge Graph Visualization

**What:** After uploading notes, automatically extract key concepts and relationships, then display them as an **interactive mind-map/knowledge graph** the student can explore.

**Why it impresses:** This shows NLP understanding (entity extraction), graph theory, and visual learning — all hot topics in EdTech research.

**Technical approach:**
- Use Gemini to extract `{concept, relatedTo, relationship}` triples from uploaded notes
- Store in MongoDB as a new `KnowledgeGraph` model
- Render with a JS graph library like vis.js or D3.js force layout
- Nodes = concepts, Edges = relationships
- Click a node ? see its summary, related flashcards, quiz scores

**Effort:** ~2-3 days

---

### 2. ?? Adaptive Learning Path (Personalized Difficulty Scaling)

**What:** Instead of fixed difficulty (easy/medium/hard), the system **automatically adjusts** quiz difficulty based on the student's past performance per topic.

**Why it impresses:** This is a core concept in **Intelligent Tutoring Systems (ITS)** — a major research area. Evaluators love hearing "our system adapts to the learner."

**Technical approach:**
- Track `masteryLevel` per topic per user (0-100) in a new `TopicMastery` model
- After each quiz: update mastery using a weighted formula (recent scores matter more)
- When generating next quiz: pass mastery level to Gemini prompt to auto-adjust difficulty
- Dashboard shows a **mastery heatmap** — green (mastered) to red (needs work)

**Effort:** ~2 days

---

### 3. ?? Voice-to-Notes (Speech Input)

**What:** Let students **speak** their notes or questions instead of typing. Especially useful for quick revision or hands-free study.

**Why it impresses:** Shows modern UX thinking + accessibility awareness. Uses the Web Speech API (no extra backend needed!).

**Technical approach:**
- Use the built-in browser `SpeechRecognition` API (works in Chrome/Edge)
- Add a mic button to Chat, RAG, Upload, and Summary pages
- Transcribed text is injected into the input field
- For upload: user can dictate notes directly ? saved as text note
- Add language selection (English, Hindi, etc.)

**Effort:** ~1 day (it's a browser API, surprisingly easy!)

---

### 4. ?? Progressive Web App (PWA) — Offline + Installable

**What:** Convert your app into a **PWA** so students can install it on their phone/laptop like a native app, and use certain features offline.

**Why it impresses:** Shows understanding of modern web standards. "Our app works even without internet" is a powerful demo statement.

**Technical approach:**
- Add a `manifest.json` (app name, icons, theme color)
- Add a `service-worker.js` to cache HTML/CSS/JS files
- Cache previously generated flashcards and summaries for offline review
- Add an "Install App" prompt on the landing page

**Effort:** ~1 day

---

### 5. ?? Collaborative Study Rooms (Real-time)

**What:** Students can create or join a **study room**, share notes, and see each other's questions/answers in real-time.

**Why it impresses:** Adds a social/collaborative dimension. Shows understanding of real-time systems.

**Technical approach:**
- Use `Socket.IO` for real-time messaging
- New `StudyRoom` model with room code, participants, shared chat
- Frontend: a new `room.html` page with shared chat + shared whiteboard
- Room creator can share their notes with all participants

**Effort:** ~3-4 days

---

## ?? Tier 2 — MEDIUM IMPACT Features (Pick 2-3 of these)

These add polish and depth without massive effort.

---

### 6. ?? Multi-Format Upload Support

**What:** Support uploading **PPTX, DOCX, and Images (OCR)** in addition to PDF and text.

**Technical approach:**
- `mammoth` npm package for DOCX ? text
- `pptx-parser` or custom XML extraction for PPTX
- `tesseract.js` for OCR on images (handwritten notes!)
- All extracted text feeds into the same pipeline (chunking ? ChromaDB ? RAG)

**Effort:** ~2 days

---

### 7. ?? Multi-Language Support (Notes & AI Responses)

**What:** Allow students to upload notes in **Hindi, Gujarati, or other languages**, and get AI responses in their preferred language.

**Technical approach:**
- Add a `preferredLanguage` field to User model
- Pass language instruction in Gemini prompts: "Respond in Hindi"
- UI language switcher in sidebar

**Effort:** ~1 day

---

### 8. ?? Streak System + Gamification

**What:** Track daily study streaks, award badges, show XP points — motivate students with gamification.

**Technical approach:**
- New `UserProgress` model: `{ streakDays, longestStreak, xpPoints, badges[] }`
- Award XP for: uploading notes (+10), completing quiz (+20), flashcard session (+15), study timer (+5/hr)
- Badges: "First Upload", "7-Day Streak", "Quiz Master (100% score)", "Night Owl (studied after 11pm)"
- Show streak fire emoji on dashboard and sidebar

**Effort:** ~2 days

---

### 9. ?? Smart Study Reminders (Email/Push Notifications)

**What:** Based on the study planner and SRS schedule, send the student **reminders** to review flashcards or study weak topics.

**Technical approach:**
- Use `node-cron` for scheduled jobs on the backend
- Check daily: which flashcards have `nextReview <= today`?
- Send email via `nodemailer` (Gmail SMTP) or browser push notifications via `web-push`

**Effort:** ~2 days

---

### 10. ?? Collaborative Note Annotations

**What:** Allow students to **highlight and annotate** specific parts of their uploaded notes, and share annotations with classmates.

**Technical approach:**
- Store annotations as `{ noteId, startOffset, endOffset, text, color, comment }`
- Render highlights over the note text in the frontend
- Export annotated notes as PDF using `html2pdf.js`

**Effort:** ~2-3 days

---

## ?? Tier 3 — QUICK WINS (1-2 hours each, but add polish)

| Feature | Description | Effort |
|---|---|---|
| **Dark/Light Theme Toggle** | You already have dark theme; add a toggle to switch to light | 1-2 hrs |
| **Export Summaries/Flashcards as PDF** | Add a "Download as PDF" button using `html2pdf.js` | 1-2 hrs |
| **Pomodoro Timer** | Upgrade the study timer to a proper Pomodoro (25min work / 5min break) | 2 hrs |
| **Note Search & Filtering** | Add a search bar + filters (by date, type, tag) on the notes/upload page | 1-2 hrs |
| **Profile Page + Avatar Upload** | Let users edit their name, email, upload avatar | 2-3 hrs |
| **Keyboard Shortcuts** | Add shortcuts like Ctrl+N for new note, Ctrl+K for search | 1 hr |
| **Loading Skeletons** | Replace "Loading..." text with animated skeleton cards | 1 hr |
| **Toast Notifications** | Upgrade success/error feedback with animated toasts | 1 hr |

---

## ?? My Recommended "v2.0" Upgrade Package

For a final year project that will **score maximum marks** and **impress in the viva**, I recommend this combination:

| # | Feature | Why | Time |
|---|---|---|---|
| 1 | **Knowledge Graph Visualization** | Visual "wow factor" + shows NLP understanding | 2-3 days |
| 2 | **Adaptive Learning Path** | Core ITS concept, huge academic value | 2 days |
| 3 | **Voice-to-Notes** | Modern UX, accessibility, easy to demo | 1 day |
| 4 | **Streak/Gamification System** | Engagement, easy to explain in viva | 2 days |
| 5 | **Multi-Format Upload (DOCX + OCR)** | Practical value, shows versatility | 2 days |
| 6 | **Export as PDF** | Quick win, highly useful | 2 hrs |
| 7 | **Pomodoro Timer** | Quick upgrade to existing feature | 2 hrs |

> **Total estimated time: ~10-12 days of focused work**
>
> This combination gives you:
> - **Academic novelty** (Knowledge Graph + Adaptive Learning)
> - **Modern UX** (Voice Input + Gamification)
> - **Practical utility** (Multi-format upload + PDF export)
> - **Easy demo moments** (everything is visually demonstrable)

---

## ?? Viva Talking Points (What Evaluators Will Ask)

After upgrading, you will be able to answer these confidently:

1. **"What's novel about your project?"** ? Knowledge Graph extraction + Adaptive difficulty using ITS principles
2. **"How does your RAG system work?"** ? ChromaDB + Ollama embeddings + Gemini generation (explain the pipeline)
3. **"How is this different from ChatGPT?"** ? Personalized to the student's own notes, tracks mastery, adapts difficulty, uses SRS for retention
4. **"What algorithms did you use?"** ? SM-2 (Spaced Repetition), Vector similarity search (cosine distance), Mastery scoring formula
5. **"What's the tech stack?"** ? Full-stack: Vanilla JS frontend, Node/Express backend, MongoDB, ChromaDB, Gemini AI, Ollama
6. **"Can it work offline?"** ? Yes, with PWA support
7. **"How does it help students?"** ? Personalized learning path, identifies weak topics, adapts quizzes, gamifies study habits

---

## ?? Implementation Checklist

### Tier 1 — High Impact
- [ ] Knowledge Graph Visualization
- [ ] Adaptive Learning Path
- [ ] Voice-to-Notes
- [ ] PWA — Offline + Installable
- [ ] Collaborative Study Rooms

### Tier 2 — Medium Impact
- [ ] Multi-Format Upload (DOCX + OCR)
- [ ] Multi-Language Support
- [ ] Streak System + Gamification
- [ ] Smart Study Reminders
- [ ] Note Annotations

### Tier 3 — Quick Wins
- [ ] Dark/Light Theme Toggle
- [ ] Export as PDF (Summaries + Flashcards)
- [ ] Pomodoro Timer Upgrade
- [ ] Note Search & Filtering
- [ ] Profile Page + Avatar
- [ ] Keyboard Shortcuts
- [ ] Loading Skeleton Screens
- [ ] Toast Notifications

---

*Built as a Final Year Project — Cortex AI for Students v2.0*
