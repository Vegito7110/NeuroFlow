import React, { useState, useEffect } from 'react';
import { Eye, Layers, AlertCircle, Brain, Aperture, PenTool } from 'lucide-react';
import TaskSuggestion from './components/TaskSuggestion';

import AIWorker from './worker?worker';

function App() {
  const [worker] = useState(() => new AIWorker());
  
  // State for UI Toggles
  const [bionicMode, setBionicMode] = useState(false);
  const [clutterFreeMode, setClutterFreeMode] = useState(false);
  const [focusTunnelMode, setFocusTunnelMode] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [aiStatus, setAiStatus] = useState("Offline");

  useEffect(() => {
    // A. Start the AI immediately when Side Panel opens
    worker.postMessage({ type: "INIT_AI" });

    // B. Listen for messages FROM the Worker (AI Brain)
    worker.onmessage = (e) => {
      const data = e.data;
      if (data.status === "LOADING") setAiStatus("Loading...");
      if (data.status === "READY") setAiStatus("Online 🟢");
      
      if (data.prediction) {
        // AI gave an answer! Send it to the webpage (content.js)
        sendMessageToContentScript("SHOW_PREDICTION", data.prediction);
      }
    };

    // C. Listen for messages FROM the Webpage (content.js)
    const handleMessageFromContentScript = (request, sender, sendResponse) => {
      if (request.action === "ANALYZE_TEXT_REQUEST") {
        // The user typed something in the page. Ask the Worker.
        worker.postMessage({ type: "PREDICT", text: request.text });
      }
    };

    // Chrome Runtime Listener
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessageFromContentScript);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleMessageFromContentScript);
      }
    };
  }, [worker]);

  // Helper to send updates to content.js (Toggles)
  const sendMessageToContentScript = async (action, value = null) => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action, value });
      }
    }
  };

  const handleToggle = (setter, state, actionName) => {
    const newState = !state;
    setter(newState);
    sendMessageToContentScript(actionName, newState);
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 border-b pb-4 border-slate-200">
        <div className="flex items-center gap-2">
            <Brain className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold text-slate-800">NeuroFlow</h1>
        </div>
        <span className="text-xs font-mono text-slate-500">{aiStatus}</span>
      </header>

      {/* READING TOOLS */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Visual & Reading</h2>
        
        {/* Bionic Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-slate-600" />
            <span className="text-slate-700 font-medium">Bionic Reading</span>
          </div>
          <ToggleBtn active={bionicMode} onClick={() => handleToggle(setBionicMode, bionicMode, "TOGGLE_BIONIC")} />
        </div>

        {/* Clutter-Free Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-slate-600" />
            <span className="text-slate-700 font-medium">Clutter-Free</span>
          </div>
          <ToggleBtn active={clutterFreeMode} onClick={() => handleToggle(setClutterFreeMode, clutterFreeMode, "TOGGLE_CLUTTER_FREE")} />
        </div>

        {/* Focus Tunnel Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Aperture size={20} className="text-purple-600" />
            <span className="text-slate-700 font-medium">Focus Tunnel</span>
          </div>
          <ToggleBtn active={focusTunnelMode} onClick={() => handleToggle(setFocusTunnelMode, focusTunnelMode, "TOGGLE_FOCUS_TUNNEL")} />
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
            <button 
                onClick={() => handleToggle(setEditorVisible, editorVisible, "TOGGLE_EDITOR")}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${editorVisible ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}
            >
                {editorVisible ? 'Active' : 'Enable'}
            </button>
        </div>
      </section>

      {/* Mood & Energy Section */}
      <section className="mb-6">
         <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Energy Check-in</h2>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
            <label className="block text-sm text-slate-600 mb-2 flex justify-between">
              <span>Sluggish (1)</span> <span>Hyper-focused (10)</span>
            </label>
            <input 
              type="range" min="1" max="10" value={energyLevel} 
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-center mt-2 font-bold text-blue-800">Energy Level: {energyLevel}</div>
         </div>
         <TaskSuggestion energyLevel={energyLevel} />
      </section>

      {/* Panic Button */}
      <section>
        <button 
          onClick={() => sendMessageToContentScript("TRIGGER_PANIC_AI")} 
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
          <AlertCircle size={24} />
          Wait, I'm Overwhelmed!
        </button>
      </section>
    </div>
  );
}

const ToggleBtn = ({ active, onClick }) => (
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${active ? 'translate-x-6' : ''}`}></div>
    </button>
);

export default App;