import React, { useState, useEffect } from 'react'; // Import useEffect
import { CheckCircle2, Battery, BatteryFull } from 'lucide-react';

const TaskSuggestion = ({ energyLevel }) => {
  const [aiTasks, setAiTasks] = useState([]);
  const [advice, setAdvice] = useState("");
  const [zone, setZone] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/suggest-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
             energy_level: parseInt(energyLevel), // Ensure it's a number
             current_mood: "focused" 
          })
        });
        
        if (res.ok) {
            const data = await res.json();
            setAiTasks(data.suggested_tasks); // Use the key from TaskResponse
            setAdvice(data.advice);
            setZone(data.zone);
        } else {
            console.error("Server Error:", await res.text());
        }
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    }
    
    // Simple debounce to prevent calling API on every slider slide
    const timer = setTimeout(() => {
        fetchTasks();
    }, 500);

    return () => clearTimeout(timer);
  }, [energyLevel]);

  const isHighEnergy = energyLevel > 5;
  const Icon = isHighEnergy ? BatteryFull : Battery;
  const bgColor = isHighEnergy ? 'bg-green-50' : 'bg-blue-50';
  const textColor = isHighEnergy ? 'text-green-700' : 'text-blue-700';

  return (
    <div className={`p-4 rounded-lg ${bgColor} border border-${isHighEnergy ? 'green' : 'blue'}-200`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={textColor} size={20} />
        <div>
            <h3 className={`font-semibold ${textColor}`}>
               {zone || (isHighEnergy ? "High Energy" : "Low Energy")}
            </h3>
            {/* Advice Text */}
            {advice && <p className="text-xs text-slate-600 mt-1">{advice}</p>}
        </div>
      </div>
      
      <ul className="space-y-2">
        {aiTasks && aiTasks.length > 0 ? (
            aiTasks.map((task, index) => (
            <li key={index} className="flex items-center gap-2 bg-white p-2 rounded shadow-sm text-sm text-gray-700">
                <CheckCircle2 size={16} className="text-gray-400" /> {task}
            </li>
            ))
        ) : (
            <li className="text-sm text-gray-500 italic">Analysing energy levels...</li>
        )}
      </ul>
    </div>
  );
};

export default TaskSuggestion;