const API_URL = "http://127.0.0.1:8000/api/v1";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // --- FEATURE: PHONETIC CORRECTION ---
    if (request.action === "ANALYZE_TEXT") {
        fetch(`${API_URL}/correct`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: request.text })
        })
        .then(res => res.json())
        .then(data => {
            if (data.suggestion && sender.tab) {
                chrome.tabs.sendMessage(sender.tab.id, { 
                    action: "SHOW_SUGGESTION", 
                    suggestion: data.suggestion 
                });
            }
        })
        .catch(err => console.error("AI Error:", err));
        
        return true; // Keep channel open for async fetch
    }

    // --- FEATURE: PANIC RESET (New Dynamic Message) ---
    if (request.action === "TRIGGER_PANIC_AI") {
        fetch(`${API_URL}/panic-reset`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            // Send the AI-generated calming message back to the UI
             chrome.runtime.sendMessage({ 
                 action: "PANIC_DATA_READY", 
                 data: data 
             });
        });
        return true;
    }
});