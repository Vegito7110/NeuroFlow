// src/worker.js
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const SELECTED_MODEL = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
let engine = null;

// Initialize the AI Engine
async function initEngine() {
    self.postMessage({ status: "LOADING", text: "Initializing..." });
    try {
        engine = await CreateMLCEngine(SELECTED_MODEL, {
            initProgressCallback: (info) => {
                console.log(info.text);
                self.postMessage({ status: "LOADING", text: info.text });
            },
        });
        self.postMessage({ status: "READY" });
    } catch (error) {
        self.postMessage({ status: "ERROR", text: error.message });
    }
}

// Core Prediction Logic
async function getPrediction(currentText) {
    if (!engine) return null;
    
    const messages = [
        { role: "system", content: "You are a phonetic autocorrect. Output ONLY the corrected sentence." },
        { role: "user", content: `User typed: "${currentText}". Correct it.` }
    ];

    const reply = await engine.chat.completions.create({
        messages,
        max_tokens: 15,
        temperature: 0.1
    });
    return reply.choices[0].message.content;
}

// Listen for messages from App.jsx
self.onmessage = async (e) => {
    const request = e.data;
    if (request.type === "INIT_AI") await initEngine();
    else if (request.type === "PREDICT") {
        const prediction = await getPrediction(request.text);
        self.postMessage({ prediction });
    }
};
