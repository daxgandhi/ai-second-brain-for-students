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
 * Helper: Poll background task status from Python AI Microservice
 */
async function getPythonTaskStatus(taskId) {
  const url = `${PYTHON_AI_URL}/api/ai/tasks/${taskId}`;
  const res = await fetch(url);
  return await res.json();
}

module.exports = {
  PYTHON_AI_URL,
  checkPythonServiceHealth,
  callPythonAiService,
  summarizeTextWithPython,
  processDocumentWithPython,
  queryRagWithPython,
  deleteNoteFromPythonChroma,
  getPythonTaskStatus
};
