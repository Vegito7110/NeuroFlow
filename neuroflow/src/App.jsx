import React, { useState, useEffect, useRef } from 'react';
import { Eye, Layers, AlertCircle, Brain, PenTool, FileText, Loader2, Hourglass } from 'lucide-react';
import AIWorker from './worker?worker';
import { useChromeStorage } from './hooks/useChromeStorage'; 

function App() {
  const workerRef = useRef(null);

  // ================= PERSISTENT STATE =================
  const [bionicMode, setBionicMode] = useChromeStorage("neuroflow_setting_bionic", false);
  const [clutterFreeMode, setClutterFreeMode] = useChromeStorage("neuroflow_setting_clutter", false);
  const [editorVisible, setEditorVisible] = useChromeStorage("neuroflow_setting_editor", false);
  
  const [tasks, setTasks] = useChromeStorage("neuroflow_tasks_active", []);
  const [completedTasks, setCompletedTasks] = useChromeStorage("neuroflow_tasks_completed", []);

  // ================= TRANSIENT STATE =================
  const [aiStatus, setAiStatus] = useState("Offline");
  
  // NEW: Cooldown State to block rapid clicks
  // Format: { "BIONIC": true, "CLUTTER": false }
  const [cooldowns, setCooldowns] = useState({});

  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [taskInput, setTaskInput] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  // ================= WORKER INITIALIZATION (DELAYED) =================
  useEffect(() => {
    let timeoutId;
    timeoutId = setTimeout(() => {
      if (!workerRef.current) {
        workerRef.current = new AIWorker();
        workerRef.current.postMessage({ type: "INIT_AI" });
        workerRef.current.onmessage = (e) => {
          const data = e.data;
          if (data.status === "LOADING") setAiStatus("Loading...");
          if (data.status === "READY") setAiStatus("Online 🟢");
          if (data.prediction) sendMessageToContentScript("SHOW_PREDICTION", data.prediction);
        };
      }
    }, 1000); // 1 Second Delay

    const handleMessageFromContentScript = (request) => {
      if (request.action === "ANALYZE_TEXT_REQUEST" && workerRef.current) {
        workerRef.current.postMessage({ type: "PREDICT", text: request.text });
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessageFromContentScript);
    }

    return () => {
      clearTimeout(timeoutId);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleMessageFromContentScript);
      }
    };
  }, []); 

  // ================= EFFECTS (Sync State) =================
  useEffect(() => {
    if (bionicMode) sendMessageToContentScript("TOGGLE_BIONIC", true);
    if (clutterFreeMode) sendMessageToContentScript("TOGGLE_CLUTTER_FREE", true);
    if (editorVisible) sendMessageToContentScript("TOGGLE_EDITOR", true);
  }, [bionicMode, clutterFreeMode, editorVisible]);

  // ================= HELPERS =================
  const sendMessageToContentScript = async (action, value = null) => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action, value });
      }
    }
  };

  // --- NEW: SAFE TOGGLE FUNCTION ---
  const handleSafeToggle = (setter, state, actionName, cooldownKey) => {
    // 1. If currently cooling down, STOP here. Do nothing.
    if (cooldowns[cooldownKey]) return;

    // 2. Perform the toggle
    const newState = !state;
    setter(newState); 
    sendMessageToContentScript(actionName, newState);

    // 3. Activate Cooldown
    setCooldowns(prev => ({ ...prev, [cooldownKey]: true }));

    // 4. Remove Cooldown after 10 seconds
    setTimeout(() => {
      setCooldowns(prev => ({ ...prev, [cooldownKey]: false }));
    }, 10000); 
  };

  // ================= API HANDLER =================
  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError(null);
    setSummary(null);

    try {
      let currentUrl = "https://example.com"; 
      if (typeof chrome !== "undefined" && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) currentUrl = tab.url;
      }

      const response = await fetch("http://localhost:8000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl, task_type: "summarize" })
      });

      const data = await response.json();
      if (data.status === "success") setSummary(data.data); 
      else setSummaryError(data.detail || "Failed to generate summary");
    } catch (err) {
      console.error(err);
      setSummaryError("Could not connect to AI Backend. Is it running?");
    } finally {
      setIsSummarizing(false);
    }
  };

  const addTask = () => {
    if (!taskInput.trim()) return;
    if (tasks.length >= 4) return;
    setTasks(prev => [...prev, taskInput.trim()]);
    setTaskInput("");
  };

  const removeTask = (index) => {
    const taskToComplete = tasks[index];
    setTasks(prev => prev.filter((_, i) => i !== index));
    setCompletedTasks(prev => [...prev, taskToComplete]);
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans w-full max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 border-b pb-4 border-slate-200">
        <div className="flex items-center gap-2">
            <Brain className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold text-slate-800">NeuroFlow</h1>
        </div>
        <span className="text-xs font-mono text-slate-500">{aiStatus}</span>
      </header>

      {/* --- AI SUMMARY FEATURE --- */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-2 mb-3">
            <FileText size={20} className="text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Page Summary</h2>
        </div>
        {!summary && !isSummarizing && (
            <button 
                onClick={handleSummarize}
                className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-sm transition-colors border border-purple-200 flex items-center justify-center gap-2"
            >
                Generate Summary
            </button>
        )}
        {isSummarizing && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
                <Loader2 className="animate-spin" size={18} />
                Reading page...
            </div>
        )}
        {summaryError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mt-2">{summaryError}</div>}
        {summary && (
            <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-xs text-slate-400 uppercase">AI Insights</span>
                    <button onClick={() => setSummary(null)} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                </div>
                {summary}
            </div>
        )}
      </section>

      {/* READING TOOLS */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Visual & Reading</h2>
        
        {/* Bionic Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {cooldowns["BIONIC"] ? <Hourglass size={20} className="text-orange-400 animate-pulse" /> : <Eye size={20} className="text-slate-600" />}
            <span className="text-slate-700 font-medium">Bionic Reading</span>
          </div>
          <ToggleBtn 
            active={bionicMode} 
            disabled={cooldowns["BIONIC"]} // Pass Disabled State
            onClick={() => handleSafeToggle(setBionicMode, bionicMode, "TOGGLE_BIONIC", "BIONIC")} 
          />
        </div>

        {/* Clutter-Free Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {cooldowns["CLUTTER"] ? <Hourglass size={20} className="text-orange-400 animate-pulse" /> : <Layers size={20} className="text-slate-600" />}
            <span className="text-slate-700 font-medium">Clutter-Free</span>
          </div>
          <ToggleBtn 
            active={clutterFreeMode} 
            disabled={cooldowns["CLUTTER"]} // Pass Disabled State
            onClick={() => handleSafeToggle(setClutterFreeMode, clutterFreeMode, "TOGGLE_CLUTTER_FREE", "CLUTTER")} 
          />
        </div>
      </section>

      {/* WRITING ASSISTANT */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Writing Companion</h2>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <PenTool size={20} className="text-orange-500" />
                <span className="text-slate-700 font-medium">Smart Editor Overlay</span>
            </div>
            {/* Editor doesn't usually destroy DOM, so we can keep the standard toggle or add buffer if needed */}
            <button 
                onClick={() => handleSafeToggle(setEditorVisible, editorVisible, "TOGGLE_EDITOR", "EDITOR")}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${editorVisible ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}
            >
                {editorVisible ? 'Active' : 'Enable'}
            </button>
        </div>
      </section>

      {/* TASKS (Unchanged) */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tasks</h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex gap-2">
            <input type="text" value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder={tasks.length >= 4 ? "Task limit reached" : "Add a task…"} disabled={tasks.length >= 4} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none disabled:bg-slate-100" />
            <button onClick={addTask} disabled={tasks.length >= 4} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:bg-slate-300">Add</button>
          </div>
          <ul className="space-y-2">
            {tasks.map((task, index) => (
              <li key={index} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                <input type="checkbox" onClick={() => removeTask(index)} readOnly className="accent-blue-600 cursor-pointer" />
                <span className="text-sm text-slate-700">{task}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-slate-400 text-right">{tasks.length}/4 tasks</div>
          <button onClick={() => setShowCompleted(!showCompleted)} className="text-xs text-blue-600 hover:underline w-full text-right">{showCompleted ? "Hide completed tasks" : "View completed tasks"}</button>
          {showCompleted && <ul className="mt-3 space-y-2">{completedTasks.map((task, index) => (<li key={index} className="text-sm text-slate-400 line-through bg-slate-50 px-3 py-2 rounded-lg">✓ {task}</li>))}</ul>}
        </div>
      </section>

      <section>
        <button onClick={() => sendMessageToContentScript("TRIGGER_PANIC_AI")} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
          <AlertCircle size={24} /> Wait, I'm Overwhelmed!
        </button>
      </section>
    </div>
  );
}

// Updated Toggle Button to show "Disabled" state
const ToggleBtn = ({ active, disabled, onClick }) => (
    <button 
      onClick={onClick}
      disabled={disabled} // Actual Disable
      className={`w-12 h-6 rounded-full p-1 transition-colors relative 
        ${disabled ? 'bg-slate-200 cursor-not-allowed opacity-60' : (active ? 'bg-blue-600' : 'bg-slate-300')}
      `}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 
        ${active ? 'translate-x-6' : ''}
      `}></div>
    </button>
);

export default App;