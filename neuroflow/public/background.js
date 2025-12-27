const API_URL = "http://127.0.0.1:8000/api/v1";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === "ANALYZE_TEXT") {
        fetch(`${API_URL}/correct`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: request.text })
        })
        .then(res => res.json())
        .then(data => {
            // FIX: Just reply to the content script immediately
            sendResponse({ 
                status: "success", 
                suggestion: data.suggestion 
            }); 
        })
        .catch(err => {
            console.error("AI Error:", err);
            sendResponse({ status: "error", message: err.toString() }); 
        });
        
        return true; // Keep channel open for async fetch
    }
});