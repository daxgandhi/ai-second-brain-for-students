const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models
const TutorSession = require('../models/TutorSession');
const Note = require('../models/Note');
const KnowledgeGraph = require('../models/KnowledgeGraph');

// Utils & Middleware
const { protect: requireAuth } = require('../middleware/auth');
const { 
  generateTutorCurriculumWithPython,
  generateTutorLessonWithPython,
  generateTutorQuestionWithPython,
  evaluateTutorAnswerWithPython
} = require('../utils/pythonAiClient');

/**
 * Helper: Find or create a tutor session for a note
 */
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ success: false, message: 'Note ID is required.' });

    const note = await Note.findOne({ _id: noteId, user: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    // Check if an in_progress session already exists
    let session = await TutorSession.findOne({ user: req.user.id, note: noteId, status: 'in_progress' });
    if (session) {
      return res.json({ success: true, session });
    }

    // Fetch Knowledge Graph to inform curriculum
    const kg = await KnowledgeGraph.findOne({ note: noteId, user: req.user.id });
    let kgNodes = [];
    let kgEdges = [];
    if (kg && kg.nodes && kg.edges) {
      kgNodes = kg.nodes;
      kgEdges = kg.edges;
    }

    // Generate Curriculum via Python AI
    console.log(`[Tutor] Generating curriculum for note ${noteId}`);
    const curriculumRes = await generateTutorCurriculumWithPython(note.textContent || "No text available.", kgNodes, kgEdges);
    
    // Create new session
    session = new TutorSession({
      user: req.user.id,
      note: noteId,
      knowledgeGraph: kg ? kg._id : null,
      curriculum: curriculumRes.curriculum || [],
      status: 'in_progress'
    });
    
    await session.save();
    return res.json({ success: true, session });

  } catch (err) {
    console.error('Failed to start tutor session:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Get session details
 */
router.get('/:sessionId', requireAuth, async (req, res) => {
  try {
    const session = await TutorSession.findOne({ _id: req.params.sessionId, user: req.user.id })
      .populate('note', 'title');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    return res.json({ success: true, session });
  } catch (err) {
    console.error('Failed to get tutor session:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Generate a lesson for the current concept
 */
router.post('/lesson', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID is required.' });

    const session = await TutorSession.findOne({ _id: sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (session.currentConceptIndex >= session.curriculum.length) {
      return res.json({ success: true, completed: true, message: 'Curriculum completed.' });
    }

    const currentConcept = session.curriculum[session.currentConceptIndex];

    // Check cache
    if (session.lessonsCache && session.lessonsCache.has(currentConcept)) {
      console.log(`[Tutor] Returning cached lesson for ${currentConcept}`);
      return res.json({ success: true, lesson: session.lessonsCache.get(currentConcept) });
    }

    // Not in cache, generate
    console.log(`[Tutor] Generating lesson for ${currentConcept}`);
    const note = await Note.findById(session.note);
    const lessonRes = await generateTutorLessonWithPython(currentConcept, note.textContent || "No text available.");

    // Store in cache
    session.lessonsCache.set(currentConcept, lessonRes);
    await session.save();

    return res.json({ success: true, lesson: lessonRes });
  } catch (err) {
    console.error('Failed to generate tutor lesson:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Generate an understanding check question
 */
router.post('/question', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Session ID is required.' });

    const session = await TutorSession.findOne({ _id: sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    const currentConcept = session.curriculum[session.currentConceptIndex];

    // If we already generated an active question that hasn't been answered correctly, return it
    if (session.activeQuestionCache && session.activeQuestionCache.concept === currentConcept) {
      console.log(`[Tutor] Returning cached question for ${currentConcept}`);
      return res.json({ success: true, question: session.activeQuestionCache.questionData });
    }

    // Need to generate a new question
    console.log(`[Tutor] Generating new question for ${currentConcept}`);
    const lessonData = session.lessonsCache.get(currentConcept);
    const lessonContext = lessonData ? JSON.stringify(lessonData) : currentConcept;
    
    // Calculate attempt number
    const attempts = session.questionHistory.filter(q => q.concept === currentConcept).length + 1;

    const questionRes = await generateTutorQuestionWithPython(currentConcept, lessonContext, attempts);
    
    // Store in cache
    session.activeQuestionCache = {
      concept: currentConcept,
      questionData: questionRes
    };
    await session.save();

    return res.json({ success: true, question: questionRes });
  } catch (err) {
    console.error('Failed to generate tutor question:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Evaluate the student's answer
 */
router.post('/answer', requireAuth, async (req, res) => {
  try {
    const { sessionId, userAnswer } = req.body;
    if (!sessionId || userAnswer === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const session = await TutorSession.findOne({ _id: sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    const currentConcept = session.curriculum[session.currentConceptIndex];
    const activeQuestion = session.activeQuestionCache;
    if (!activeQuestion || activeQuestion.concept !== currentConcept) {
      return res.status(400).json({ success: false, message: 'No active question found.' });
    }

    console.log(`[Tutor] Evaluating answer for ${currentConcept}`);
    const evaluationRes = await evaluateTutorAnswerWithPython(
      currentConcept,
      activeQuestion.questionData.question,
      userAnswer,
      activeQuestion.questionData.correct_answer
    );

    // Calculate attempts
    const previousAttempts = session.questionHistory.filter(q => q.concept === currentConcept).length;
    const currentAttempt = previousAttempts + 1;

    // Save to history
    session.questionHistory.push({
      concept: currentConcept,
      question: activeQuestion.questionData.question,
      userAnswer: userAnswer,
      isCorrect: evaluationRes.correct,
      score: evaluationRes.score,
      attempts: currentAttempt
    });

    // Update Mastery & Progress
    if (evaluationRes.correct) {
      if (!session.completedConcepts.includes(currentConcept)) {
        session.completedConcepts.push(currentConcept);
      }
      
      // Calculate dynamic mastery: 1st try=100%, 2nd=80%, 3rd=60%, etc (min 40%)
      const dynamicMastery = Math.max(40, 100 - ((currentAttempt - 1) * 20));
      session.mastery.set(currentConcept, dynamicMastery);
      
      session.activeQuestionCache = null;
      session.currentConceptIndex += 1;
    } else {
      // Do not penalize heavily immediately. Wait for success to determine final mastery.
      // Clear active question so a *new* adaptive question is generated next time
      session.activeQuestionCache = null;
    }

    await session.save();

    return res.json({ success: true, evaluation: evaluationRes });
  } catch (err) {
    console.error('Failed to evaluate answer:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Complete the session
 */
router.post('/:sessionId/complete', requireAuth, async (req, res) => {
  try {
    const session = await TutorSession.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    session.status = 'completed';
    session.completedAt = new Date();

    // Calculate Completion Stats
    let totalQuestions = session.questionHistory.length;
    let correctAnswers = session.questionHistory.filter(q => q.isCorrect).length;
    
    let totalMastery = 0;
    let strongConcepts = [];
    let weakConcepts = [];
    
    session.curriculum.forEach(concept => {
      const score = session.mastery.get(concept) || 0;
      totalMastery += score;
      if (score >= 80) strongConcepts.push(concept);
      else weakConcepts.push(concept);
    });
    
    const overallMastery = session.curriculum.length > 0 ? Math.round(totalMastery / session.curriculum.length) : 0;

    session.completionStats = {
      totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      overallMastery,
      strongConcepts,
      weakConcepts,
      totalTopics: session.curriculum.length
    };

    await session.save();

    return res.json({ success: true, message: 'Session marked as completed.', stats: session.completionStats });
  } catch (err) {
    console.error('Failed to complete session:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
