import React, { useState } from 'react';
import { Eye, Layers, AlertCircle, Brain } from 'lucide-react';
import TaskSuggestion from './components/TaskSuggestion';

function App() {
  const [bionicMode, setBionicMode] = useState(false);
  const [clutterFreeMode, setClutterFreeMode] = useState(false);
  // Default to 5 (Integer)
  const [energyLevel, setEnergyLevel] = useState(5);

  // Helper to send messages to the content script/background script
  const sendMessage = async (action, value = null) => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action, value });
      }
    } else {
      console.warn("Chrome API not detected (Running outside extension?)");
    }
  };

  const handleToggle = (setter, state, actionName) => {
    const newState = !state;
    setter(newState);
    sendMessage(actionName, newState);
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="flex items-center gap-2 mb-6 border-b pb-4 border-slate-200">
        <Brain className="text-blue-600" size={28} />
        <h1 className="text-xl font-bold text-slate-800">NeuroFlow</h1>
      </header>

      {/* Toggles Section */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reading Tools</h2>
        
        {/* Bionic Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-slate-600" />
            <span className="text-slate-700 font-medium">Bionic Reading</span>
          </div>
          <button 
            onClick={() => handleToggle(setBionicMode, bionicMode, "TOGGLE_BIONIC")}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${bionicMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${bionicMode ? 'translate-x-6' : ''}`}></div>
          </button>
        </div>

         {/* Clutter-Free Toggle */}
         <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-slate-600" />
            <span className="text-slate-700 font-medium">Clutter-Free Reader</span>
          </div>
          <button 
             onClick={() => handleToggle(setClutterFreeMode, clutterFreeMode, "TOGGLE_CLUTTER_FREE")}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${clutterFreeMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${clutterFreeMode ? 'translate-x-6' : ''}`}></div>
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
              // Note: Inputs return strings, but TaskSuggestion.jsx now handles the parseInt
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-center mt-2 font-bold text-blue-800">Energy Level: {energyLevel}</div>
         </div>
         
         {/* Pass the state down to the component we just fixed */}
         <TaskSuggestion energyLevel={energyLevel} />
      </section>

      {/* Panic Button Section */}
      <section>
        <button 
          /* UPDATE: If you implemented the Phase 3 backend logic in background.js, 
             change this to "TRIGGER_PANIC_AI". 
             If you only have Phase 2 logic, keep it "TRIGGER_PANIC".
          */
          onClick={() => sendMessage("TRIGGER_PANIC_AI")} 
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
          <AlertCircle size={24} />
          Wait, I'm Overwhelmed!
        </button>
      </section>
    </div>
  )
}

export default App