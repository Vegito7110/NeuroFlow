#  NeuroFlow

**NeuroFlow** is a Chrome extension designed to support neurodivergent users — including those with ADHD, dyslexia, and anxiety — by making the web easier to read, write, and navigate.

---

##  Features

###  Page Summary
Instantly summarize any webpage using AI. Instead of reading through a wall of text, get the key insights in seconds.

<img src="screenshots/task-breakdown.png" width="380" alt="Page Summary and Task Breakdown" />

---

###  Writing Companion
A floating smart editor overlay that appears on any page. Type naturally — even with phonetic spelling errors — and the AI will correct and complete your sentence in real time. Press **Tab** to accept the suggestion.

<img src="screenshots/writing-companion.png" width="340" alt="Writing Companion with AI suggestions" />

---

###  Task Breakdown
Add tasks to your NeuroFlow panel, then click any task to have the AI break it into clear, bite-sized steps — making it easier to start and stay on track.

<img src="screenshots/extension-panel.png" width="380" alt="NeuroFlow extension panel with tasks" />

---

###  Panic Reset
Feeling overwhelmed? Hit the **"Wait, I'm Overwhelmed!"** button to trigger a full-screen breathing reset with a calming message and one simple micro-step to get you back on track.

<img src="screenshots/panic-mode.png" width="380" alt="Panic mode breathing overlay" />

---

###  Reading Tools
- **Bionic Reading** — bolds the first half of every word to guide your eyes and improve focus
- **Clutter-Free Mode** — strips out distracting page elements, leaving only the core content

---

##  Project Structure

```
NeuroFlow/
├── neuroflow/           # Chrome Extension (React + Vite + WebLLM)
├── neuroflow-backend/   # Python FastAPI backend (AI features)
└── frontend/            # Marketing landing page (React + Vite)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Chrome

---

### 1. Backend Setup

```bash
cd neuroflow-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
pip install langchain-google-genai

# Create a .env file with your API keys
echo "GROQ_API_KEY=your_groq_key_here" >> .env
echo "GOOGLE_API_KEY=your_google_key_here" >> .env
```

Run the servers (two separate terminals):

```bash
# Terminal 1 — Feature API (writing companion, panic reset)
uvicorn app:app --reload --port 8000

# Terminal 2 — Web Agent (page summary, task breakdown)
uvicorn main:app --reload --port 8001
```

> Get your **Groq API key** free at [console.groq.com](https://console.groq.com)  
> Get your **Google API key** at [aistudio.google.com](https://aistudio.google.com)

---

### 2. Build the Extension

```bash
cd neuroflow
npm install
npm run build
```

Then load it in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `neuroflow/dist` folder

> **Note:** On first load, the writing companion downloads the local AI model (~2GB from HuggingFace). The status indicator will show `Loading...` until it's ready, then switch to `Online 🟢`.

---

### 3. Landing Page (Optional)

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Extension UI | React 19, Vite, Tailwind CSS |
| Local AI (Writing) | WebLLM — Phi-3-mini (runs in browser) |
| Backend AI | LangChain, LangGraph, Groq (Llama 3.1), Google Gemini |
| Backend Server | FastAPI, Uvicorn |
| Landing Page | React 19, Vite, Tailwind CSS |

---

## 📋 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/process` | POST | Page summary / task breakdown (main.py, port 8001) |
| `/api/v1/correct` | POST | Phonetic text correction (app.py, port 8000) |
| `/api/v1/suggest-tasks` | POST | Energy-based task suggestions |
| `/api/v1/panic-reset` | POST | Generate calming message + micro-step |
