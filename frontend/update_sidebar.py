import os
import re

NEW_SIDEBAR = """    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-text">Cortex <span>AI</span></div>
        <div class="logo-sub">Study Assistant</div>
      </div>
      <div class="sidebar-user">
        <div class="user-avatar" id="sidebar-avatar">U</div>
        <div class="user-info">
          <div class="user-name" id="sidebar-name">Loading...</div>
          <div class="user-email" id="sidebar-email"></div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-label">MAIN</div>
        <a href="dashboard.html" class="nav-item" data-page="dashboard"> <span class="nav-icon">🏠</span> Dashboard</a>
        <a href="chat.html" class="nav-item" data-page="chat"> <span class="nav-icon">💬</span> AI Chat</a>
        <a href="analytics.html" class="nav-item" data-page="analytics"> <span class="nav-icon">📊</span> Analytics</a>
        
        <div class="nav-label" style="margin-top:16px;">KNOWLEDGE</div>
        <a href="upload.html" class="nav-item" data-page="upload"> <span class="nav-icon">📁</span> Upload Notes</a>
        <a href="rag.html" class="nav-item" data-page="rag"> <span class="nav-icon">📚</span> Chat with Notes</a>
        <a href="summary.html" class="nav-item" data-page="summary"> <span class="nav-icon">📋</span> Summary</a>
        <a href="knowledge-graph.html" class="nav-item" data-page="knowledge-graph"> <span class="nav-icon">🧠</span> Knowledge Graph</a>
        
        <div class="nav-label" style="margin-top:16px;">STUDY</div>
        <a href="exam.html" class="nav-item" data-page="exam"> <span class="nav-icon">🎯</span> Exam Generator</a>
        <a href="exam-history.html" class="nav-item" data-page="exam-history"> <span class="nav-icon">📜</span> Exam History</a>
        <a href="flashcards.html" class="nav-item" data-page="flashcards"> <span class="nav-icon">📇</span> Flashcards</a>
        <a href="session.html" class="nav-item" data-page="session"> <span class="nav-icon">⏱️</span> Study Timer</a>
        <a href="planner.html" class="nav-item" data-page="planner"> <span class="nav-icon">📅</span> Study Planner</a>
      </nav>
      <div class="sidebar-footer">
        <button id="logout-btn" class="btn btn-ghost" style="width:100%; justify-content:center; border: 1px solid rgba(239,68,68,0.3); color: var(--danger);">
          <span class="nav-icon" style="margin:0;">🚪</span> Logout
        </button>
      </div>
    </aside>"""

frontend_dir = os.path.dirname(os.path.abspath(__file__))

for filename in os.listdir(frontend_dir):
    if filename.endswith(".html") and filename not in ["index.html", "login.html", "register.html"]:
        filepath = os.path.join(frontend_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace the aside block using a regex.
        new_content = re.sub(
            r'^[ \t]*<aside class="sidebar">.*?</aside>',
            NEW_SIDEBAR,
            content,
            flags=re.DOTALL | re.MULTILINE
        )
        
        if new_content != content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"No match or no change in {filename}")
