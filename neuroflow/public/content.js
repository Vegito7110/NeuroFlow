// ... inside createEditorWidget ...

    // 6. REAL AI Logic (Connects to App.jsx in Side Panel)
    const input = shadow.getElementById('nf-input');
    const ghost = shadow.getElementById('nf-ghost');
    let typingTimer;

    // A. Send text to Side Panel when user types
    input.addEventListener('input', (e) => {
        const text = e.target.value;
        ghost.innerText = ""; // Clear old ghost
        
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (text.length > 3) {
                // "Hey App.jsx, can you analyze this?"
                chrome.runtime.sendMessage({ 
                    action: "ANALYZE_TEXT_REQUEST", 
                    text: text 
                });
            }
        }, 500); // Debounce 500ms
    });

    // B. Receive prediction from Side Panel
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "SHOW_PREDICTION") {
            const prediction = request.value;
            // Only show if it's actually valid
            if (prediction && prediction.length > 0) {
                 ghost.innerText = prediction;
            }
        }
    });

    // C. Tab to Accept
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && ghost.innerText) {
            e.preventDefault();
            input.value = ghost.innerText;
            ghost.innerText = "";
        }
    });