import React, { useState, useEffect } from 'react';
import { Eye, Layers, AlertCircle, Brain, PenTool } from 'lucide-react';

import AIWorker from './worker?worker';

function App() {
  const [worker] = useState(() => new AIWorker());

  // ================= EXISTING STATE =================
  const [bionicMode, setBionicMode] = useState(false);
  const [clutterFreeMode, setClutterFreeMode] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [aiStatus, setAiStatus] = useState("Offline");

  // ================= TASK STATE =================
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  // ================= TASK HANDLERS =================
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

  // ================= EXISTING EFFECT =================
  useEffect(() => {
    worker.postMessage({ type: "INIT_AI" });

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.status === "LOADING") setAiStatus("Loading...");
      if (data.status === "READY") setAiStatus("Online 🟢");

      if (data.prediction) {
        sendMessageToContentScript("SHOW_PREDICTION", data.prediction);
      }
    };

    const handleMessageFromContentScript = (request) => {
      if (request.action === "ANALYZE_TEXT_REQUEST") {
        worker.postMessage({ type: "PREDICT", text: request.text });
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessageFromContentScript);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleMessageFromContentScript);
      }
    };
  }, [worker]);

  // ================= EXISTING HELPERS =================
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

      {/* HEADER */}
      <header className="flex items-center justify-between mb-6 border-b pb-4 border-slate-200">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-600" size={28} />
          <h1 className="text-xl font-bold text-slate-800">NeuroFlow</h1>
        </div>
        <span className="text-xs font-mono text-slate-500">{aiStatus}</span>
      </header>

      {/* VISUAL & READING */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Visual & Reading
        </h2>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-slate-600" />
            <span className="text-slate-700 font-medium">Bionic Reading</span>
          </div>
          <ToggleBtn
            active={bionicMode}
            onClick={() => handleToggle(setBionicMode, bionicMode, "TOGGLE_BIONIC")}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-slate-600" />
            <span className="text-slate-700 font-medium">Clutter-Free</span>
          </div>
          <ToggleBtn
            active={clutterFreeMode}
            onClick={() =>
              handleToggle(setClutterFreeMode, clutterFreeMode, "TOGGLE_CLUTTER_FREE")
            }
          />
        </div>
      </section>

      {/* WRITING COMPANION */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Writing Companion
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool size={20} className="text-orange-500" />
            <span className="text-slate-700 font-medium">Smart Editor Overlay</span>
          </div>
          <button
            onClick={() =>
              handleToggle(setEditorVisible, editorVisible, "TOGGLE_EDITOR")
            }
            className={`px-3 py-1 rounded-lg text-sm font-bold ${
              editorVisible
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {editorVisible ? "Active" : "Enable"}
          </button>
        </div>
      </section>

      {/* TASKS */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Tasks
        </h2>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">

          <div className="flex gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder={tasks.length >= 4 ? "Task limit reached" : "Add a task…"}
              disabled={tasks.length >= 4}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none disabled:bg-slate-100"
            />
            <button
              onClick={addTask}
              disabled={tasks.length >= 4}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:bg-slate-300"
            >
              Add
            </button>
          </div>

          <ul className="space-y-2">
            {tasks.map((task, index) => (
              <li
                key={index}
                className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg"
              >
                <input
                  type="checkbox"
                  onClick={() => removeTask(index)}
                  readOnly
                  className="accent-blue-600 cursor-pointer"
                />

                <span className="text-sm text-slate-700">{task}</span>
              </li>
            ))}
          </ul>

          <div className="text-xs text-slate-400 text-right">
            {tasks.length}/4 tasks
          </div>

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-blue-600 hover:underline w-full text-right"
          >
            {showCompleted ? "Hide completed tasks" : "View completed tasks"}
          </button>

          {showCompleted && completedTasks.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-2">
              No completed tasks yet
            </p>
          )}



          {showCompleted && (
            <ul className="mt-3 space-y-2">
              {completedTasks.map((task, index) => (
                <li
                  key={index}
                  className="text-sm text-slate-400 line-through bg-slate-50 px-3 py-2 rounded-lg"
                >
                  ✓ {task}
                </li>
              ))}
            </ul>
          )}

        </div>
      </section>

      {/* PANIC BUTTON */}
      <section>
        <button
          onClick={() => sendMessageToContentScript("TRIGGER_PANIC_AI")}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
        >
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
    className={`w-12 h-6 rounded-full p-1 ${
      active ? "bg-blue-600" : "bg-slate-300"
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full transform ${
        active ? "translate-x-6" : ""
      }`}
    ></div>
  </button>
);

export default App;
