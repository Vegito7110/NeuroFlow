import React, { useState, useEffect, useRef } from 'react';
import { Eye, Layers, AlertCircle, Brain, PenTool, FileText, Loader2, Hourglass, X, ListChecks } from 'lucide-react';
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
  const [cooldowns, setCooldowns] = useState({});
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [taskInput, setTaskInput] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Breakdown State
  const [selectedTask, setSelectedTask] = useState(null);
  const [subSteps, setSubSteps] = useState(null);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  // ================= WORKER INITIALIZATION =================
  useEffect(() => {
    let timeoutId = setTimeout(() => {
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
    }, 1000); 

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

  // ================= THE SYNC ENGINE (Crucial Fix) =================
  // This is the ONLY place where messages are sent. 
  // It guarantees the Content Script always matches the React State.
  useEffect(() => {
    sendMessageToContentScript("TOGGLE_BIONIC", bionicMode);
    sendMessageToContentScript("TOGGLE_CLUTTER_FREE", clutterFreeMode);
    sendMessageToContentScript("TOGGLE_EDITOR", editorVisible);
  }, [bionicMode, clutterFreeMode, editorVisible]);

  // ================= HELPERS =================
  const sendMessageToContentScript = async (action, value = null) => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { action, value }).catch(() => {
            // Ignore errors if the content script isn't ready yet
          });
        }
      } catch (e) { console.error(e); }
    }
  };

  // --- 1. SAFE TOGGLE (Fixed: Removed manual message sending) ---
  const handleSafeToggle = (setter, state, cooldownKey, duration = 6000) => {
    if (cooldowns[cooldownKey]) return;
    
    // Just update state. The useEffect above will handle the messaging.
    setter(!state); 
    
    // Start Cooldown
    setCooldowns(prev => ({ ...prev, [cooldownKey]: true }));
    setTimeout(() => {
      setCooldowns(prev => ({ ...prev, [cooldownKey]: false }));
    }, duration); 
  };

  // --- 2. SIMPLE TOGGLE (Fixed: Removed manual message sending) ---
  const handleSimpleToggle = (setter, state) => {
    setter(!state);
  };

  // ================= API HANDLERS =================
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

  const handleTaskClick = async (taskText) => {
    setSelectedTask(taskText);
    setSubSteps(null);
    setIsBreakingDown(true);
    try {
      const response = await fetch("http://localhost:8000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_type: "breakdown", user_input: taskText })
      });
      const data = await response.json();
      if (data.status === "success") setSubSteps(data.data);
      else setSubSteps("Failed to break down task.");
    } catch (err) {
      setSubSteps("Error connecting to AI.");
    } finally {
      setIsBreakingDown(false);
    }
  };

  // ================= TASK HANDLERS =================
  const addTask = () => {
    if (!taskInput.trim() || tasks.length >= 4) return;
    setTasks(prev => [...prev, taskInput.trim()]);
    setTaskInput("");
  };

  const removeTask = (index) => {
    const taskToComplete = tasks[index];
    setTasks(prev => prev.filter((_, i) => i !== index));
    setCompletedTasks(prev => [...prev, taskToComplete]);
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans w-full max-w-md mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 border-b pb-4 border-slate-200">
        <div className="flex items-center gap-2">
            <Brain className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold text-slate-800">NeuroFlow</h1>
        </div>
        <span className="text-xs font-mono text-slate-500">{aiStatus}</span>
      </header>

      {/* --- AI SUMMARY --- */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-2 mb-3">
            <FileText size={20} className="text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Page Summary</h2>
        </div>
        {!summary && !isSummarizing && (
            <button onClick={handleSummarize} className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg text-sm transition-colors border border-purple-200 flex items-center justify-center gap-2">
                Generate Summary
            </button>
        )}
        {isSummarizing && <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-4"><Loader2 className="animate-spin" size={18} /> Reading page...</div>}
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

      {/* --- READING TOOLS --- */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Visual & Reading</h2>
        
        {/* Bionic Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {cooldowns["BIONIC"] ? <Hourglass size={20} className="text-orange-400 animate-pulse" /> : <Eye size={20} className="text-slate-600" />}
            <span className="text-slate-700 font-medium">Bionic Reading</span>
          </div>
          <ToggleBtn active={bionicMode} disabled={cooldowns["BIONIC"]} onClick={() => handleSafeToggle(setBionicMode, bionicMode, "BIONIC", 6000)} />
        </div>

        {/* Clutter-Free Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {cooldowns["CLUTTER"] ? <Hourglass size={20} className="text-orange-400 animate-pulse" /> : <Layers size={20} className="text-slate-600" />}
            <span className="text-slate-700 font-medium">Clutter-Free</span>
          </div>
          <ToggleBtn active={clutterFreeMode} disabled={cooldowns["CLUTTER"]} onClick={() => handleSafeToggle(setClutterFreeMode, clutterFreeMode, "CLUTTER", 6000)} />
        </div>
      </section>

      {/* --- WRITING ASSISTANT --- */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Writing Companion</h2>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <PenTool size={20} className="text-orange-500" />
                <span className="text-slate-700 font-medium">Smart Editor Overlay</span>
            </div>
            <button onClick={() => handleSimpleToggle(setEditorVisible, editorVisible)} className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${editorVisible ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                {editorVisible ? 'Active' : 'Enable'}
            </button>
        </div>
      </section>

      {/* --- TASKS --- */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tasks</h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex gap-2">
            <input type="text" value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder={tasks.length >= 4 ? "Task limit reached" : "Add a task…"} disabled={tasks.length >= 4} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none disabled:bg-slate-100" />
            <button onClick={addTask} disabled={tasks.length >= 4} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:bg-slate-300">Add</button>
          </div>
          <ul className="space-y-2">
            {tasks.map((task, index) => (
              <li key={index} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg group">
                <input type="checkbox" onClick={(e) => { e.stopPropagation(); removeTask(index); }} readOnly className="accent-blue-600 cursor-pointer" />
                <span onClick={() => handleTaskClick(task)} className="text-sm text-slate-700 flex-1 cursor-pointer hover:text-blue-600 transition-colors flex items-center justify-between">
                    {task} <ListChecks size={14} className="text-slate-300 group-hover:text-blue-400" />
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => setShowCompleted(!showCompleted)} className="text-xs text-blue-600 hover:underline w-full text-right">{showCompleted ? "Hide completed tasks" : "View completed tasks"}</button>
          {showCompleted && <ul className="mt-3 space-y-2">{completedTasks.map((task, index) => (<li key={index} className="text-sm text-slate-400 line-through bg-slate-50 px-3 py-2 rounded-lg">✓ {task}</li>))}</ul>}
        </div>
      </section>

      {selectedTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[1px]">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-slate-200 p-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                <div><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Breaking Down</h3><p className="text-slate-800 font-semibold text-sm line-clamp-1">{selectedTask}</p></div>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="min-h-[100px]">
                {isBreakingDown ? ( <div className="flex flex-col items-center justify-center h-24 text-slate-500 gap-2"><Loader2 className="animate-spin text-blue-500" size={24} /><span className="text-xs">Thinking step-by-step...</span></div> ) : ( <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-[300px] overflow-y-auto">{subSteps}</div> )}
            </div>
          </div>
        </div>
      )}

      <section>
        <button onClick={() => sendMessageToContentScript("TRIGGER_PANIC_AI")} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
          <AlertCircle size={24} /> Wait, I'm Overwhelmed!
        </button>
      </section>
    </div>
  );
}

const ToggleBtn = ({ active, disabled, onClick }) => (
    <button onClick={onClick} disabled={disabled} className={`w-12 h-6 rounded-full p-1 transition-colors relative ${disabled ? 'bg-slate-200 cursor-not-allowed opacity-60' : (active ? 'bg-blue-600' : 'bg-slate-300')}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6' : ''}`}></div>
    </button>
);

export default App;