import React from 'react';
import { Eye, Layers, AlertCircle, Brain, Loader2 } from 'lucide-react'; 
import TaskSuggestion from './components/TaskSuggestion';
// Import the new hook
import { useChromeStorage } from './hooks/useChromeStorage'; 

function App() {
  // REPLACE useState with useChromeStorage
  // The first argument is the unique key for saving
  const [bionicMode, setBionicMode] = useChromeStorage("settings_bionic", false);
  const [clutterFreeMode, setClutterFreeMode] = useChromeStorage("settings_clutter", false);
  const [energyLevel, setEnergyLevel] = useChromeStorage("settings_energy", 5);
  
  const [isPanicking, setIsPanicking] = React.useState(false); // This doesn't need to be saved

  const sendMessageToContentScript = async (action, data = null) => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action, data });
      }
    }
  };

  const handleToggle = (setter, state, actionName) => {
    const newState = !state;
    setter(newState);
    sendMessageToContentScript(actionName, { value: newState });
  };

  const handlePanicClick = async () => {
    setIsPanicking(true);
    try {
        // 1. Fetch AI Calming Text
        const res = await fetch("http://127.0.0.1:8000/api/v1/panic-reset", { method: "POST" });
        const aiData = await res.json();
        
        // 2. Send to Content Script
        sendMessageToContentScript("TRIGGER_PANIC", aiData);
    } catch (err) {
        console.error("Panic Fetch Failed", err);
        // Fallback: Send empty data (Content script will use defaults)
        sendMessageToContentScript("TRIGGER_PANIC", {});
    } finally {
        setIsPanicking(false);
    }
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen w-[350px]">
      <header className="flex items-center gap-2 mb-6 border-b pb-4 border-slate-200">
        <Brain className="text-blue-600" size={28} />
        <h1 className="text-xl font-bold text-slate-800">NeuroFlow</h1>
      </header>

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

      <section className="mb-6">
         <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Energy Check-in</h2>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
            <input 
              type="range" min="1" max="10" value={energyLevel} 
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-center mt-2 font-bold text-blue-800">Energy Level: {energyLevel}</div>
         </div>
         <TaskSuggestion energyLevel={energyLevel} />
      </section>

      <section>
        <button 
          onClick={handlePanicClick}
          disabled={isPanicking}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-70">
          {isPanicking ? <Loader2 className="animate-spin" /> : <AlertCircle size={24} />}
          {isPanicking ? "Breathing..." : "Wait, I'm Overwhelmed!"}
        </button>
      </section>
    </div>
  )
}

export default App;