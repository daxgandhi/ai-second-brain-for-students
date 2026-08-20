// ============================================================
// backend/utils/pythonAiClient.js
// API Gateway Client for Python FastAPI AI Microservice (Port 8001)
// ============================================================

const PYTHON_AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Check if the Python FastAPI AI Microservice is online
 */
async function checkPythonServiceHealth() {
  try {
    const res = await fetch(`${PYTHON_AI_URL}/health`, { method: 'GET' });
    if (!res.ok) return { status: 'down', code: res.status };
    const data = await res.json();
    return { status: 'online', data };
  } catch (err) {
    return { status: 'unreachable', error: err.message };
  }
}

/**
 * Send request to Python AI Microservice with JSON payload
 */
async function callPythonAiService(endpoint, body, method = 'POST') {
  const url = `${PYTHON_AI_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Python Service Error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[Python API Client Error] ${method} ${endpoint}:`, err.message);
    throw err;
  }
}

/**
 * Helper: Summarize text via Python AI Microservice
 */
async function summarizeTextWithPython(text, title = 'Study Note') {
  return await callPythonAiService('/api/ai/summary', { text, title });
}

/**
 * Helper: Ingest document (PDF/text) asynchronously via Python AI Microservice
 */
async function processDocumentWithPython(noteId, title, textContent, filePath) {
  return await callPythonAiService('/api/ai/document/process', {
    note_id: noteId.toString(),
    title,
    text_content: textContent,
    file_path: filePath
  });
}

/**
 * Helper: Perform RAG query via Python AI Microservice
 */
async function queryRagWithPython(question, noteId = null, topK = 4) {
  return await callPythonAiService('/api/ai/rag/chat', {
    question,
    note_id: noteId ? noteId.toString() : null,
    top_k: topK
  });
}

/**
 * Helper: Delete vector embeddings for a note from Python ChromaDB
 */
async function deleteNoteFromPythonChroma(noteId) {
  const url = `${PYTHON_AI_URL}/api/ai/rag/notes/${noteId}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    console.warn(`[Python API Client Warning] Failed to delete note ${noteId} from ChromaDB:`, err.message);
    return { status: 'error', error: err.message };
  }
}

/**
 * Helper: Standard conversational chat via Python AI Microservice
 */
async function chatWithPython(message) {
  return await callPythonAiService('/api/ai/chat', { message });
}

/**
 * Helper: Generate flashcards deck via Python AI Microservice
 */
async function generateFlashcardsWithPython(topic, count = 5) {
  return await callPythonAiService('/api/ai/flashcards/generate', { topic, count });
}

/**
 * Helper: Calculate SRS rating via Python AI Microservice
 */
async function calculateSrsWithPython(rating, interval, repetition, easeFactor) {
  return await callPythonAiService('/api/ai/flashcards/srs-rate', {
    rating,
    interval,
    repetition,
    ease_factor: easeFactor
  });
}

/**
 * Helper: Generate MCQ exam questions via Python AI Microservice
 */
async function generateExamWithPython(topic, questionCount = 5, difficulty = 'medium', content = null) {
  return await callPythonAiService('/api/ai/exam/generate', {
    topic,
    question_count: questionCount,
    difficulty,
    content
  });
}

/**
 * Helper: Generate day-by-day study schedule via Python AI Microservice
 */
async function generatePlannerWithPython(subject, timeframe = '7 days', hoursPerDay = 2.0) {
  return await callPythonAiService('/api/ai/planner/generate', {
    subject,
    timeframe,
    hours_per_day: hoursPerDay
  });
}

/**
 * Helper: Generate weak topic & study recommendations via Python AI Microservice
 */
async function generateRecommendationsWithPython(examResults = [], studyTopics = [], kgContext = []) {
  return await callPythonAiService('/api/ai/recommendation/generate', {
    exam_results: examResults,
    study_topics: studyTopics,
    kg_context: kgContext
  });
}

/**
 * Helper: Poll background task status from Python AI Microservice
 */
async function getPythonTaskStatus(taskId) {
  const url = `${PYTHON_AI_URL}/api/ai/tasks/${taskId}`;
  const res = await fetch(url);
  return await res.json();
}

/**
 * Helper: Generate knowledge graph from note text via Python AI Microservice
 */
async function generateKnowledgeGraphWithPython(text, title = 'Knowledge Graph') {
  return await callPythonAiService('/api/ai/knowledge-graph/generate', { text, title });
}

/**
 * Helper: Ask a question about the knowledge graph via Python AI Microservice
 */
async function askKnowledgeGraphWithPython(question, graphContext) {
  return await callPythonAiService('/api/ai/knowledge-graph/ask', { 
    question, 
    graph_context: graphContext 
  });
}

/**
 * Helper: Generate insights for a knowledge graph via Python AI Microservice
 */
async function generateGraphInsightsWithPython(graphContext) {
  return await callPythonAiService('/api/ai/knowledge-graph/insights', { 
    graph_context: graphContext 
  });
}

/**
 * Helper: Explain a concept based on note context via Python AI Microservice
 */
async function explainConceptWithPython(conceptName, graphContext, noteContent) {
  return await callPythonAiService('/api/ai/knowledge-graph/concept/explain', {
    concept: conceptName,
    graph_context: graphContext,
    note_content: noteContent
  });
}

// ── Cortex Tutor AI Microservice Helpers ──────────────────────

/**
 * Helper: Generate curriculum based on Knowledge Graph and Note content
 */
async function generateTutorCurriculumWithPython(noteContent, kgNodes, kgEdges) {
  return await callPythonAiService('/api/ai/tutor/curriculum', {
    note_content: noteContent,
    kg_nodes: kgNodes,
    kg_edges: kgEdges
  });
}

/**
 * Helper: Generate structured lesson for a specific concept
 */
async function generateTutorLessonWithPython(concept, noteContent) {
  return await callPythonAiService('/api/ai/tutor/lesson', {
    concept,
    note_content: noteContent
  });
}

/**
 * Helper: Generate understanding check question
 */
async function generateTutorQuestionWithPython(concept, lessonContext, attemptNumber = 1) {
  return await callPythonAiService('/api/ai/tutor/question', {
    concept,
    lesson_context: lessonContext,
    attempt_number: attemptNumber
  });
}

/**
 * Helper: Evaluate student answer and provide feedback
 */
async function evaluateTutorAnswerWithPython(concept, question, userAnswer, correctAnswer) {
  return await callPythonAiService('/api/ai/tutor/evaluate', {
    concept,
    question,
    user_answer: userAnswer,
    correct_answer: correctAnswer
  });
}

module.exports = {
  PYTHON_AI_URL,
  checkPythonServiceHealth,
  callPythonAiService,
  summarizeTextWithPython,
  processDocumentWithPython,
  queryRagWithPython,
  deleteNoteFromPythonChroma,
  chatWithPython,
  generateFlashcardsWithPython,
  calculateSrsWithPython,
  generateExamWithPython,
  generatePlannerWithPython,
  generateRecommendationsWithPython,
  getPythonTaskStatus,
  generateKnowledgeGraphWithPython,
  askKnowledgeGraphWithPython,
  generateGraphInsightsWithPython,
  explainConceptWithPython,
  generateTutorCurriculumWithPython,
  generateTutorLessonWithPython,
  generateTutorQuestionWithPython,
  evaluateTutorAnswerWithPython
};
