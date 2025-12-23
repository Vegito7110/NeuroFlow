let state = { bionic: false, clutterFree: false };

// 1. Listen for messages from React Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "TOGGLE_BIONIC":
            toggleBionic(request.value); break;
        case "TOGGLE_CLUTTER_FREE":
            toggleClutterFree(request.value); break;
        case "TRIGGER_PANIC":
            triggerPanicRoutine(); break;
    }
});

// --- Feature: Bionic Reading ---
function toggleBionic(isActive) {
    state.bionic = isActive;
    const paragraphs = document.querySelectorAll('p, article');
    paragraphs.forEach(p => {
        if (isActive) {
            if (!p.dataset.original) p.dataset.original = p.innerHTML; // Save original
            p.innerHTML = p.innerText.split(' ').map(word => {
                if (word.length < 3) return word;
                const mid = Math.ceil(word.length / 2);
                return `<b class="neuroflow-bionic">${word.slice(0, mid)}</b>${word.slice(mid)}`;
            }).join(' ');
        } else {
            if (p.dataset.original) p.innerHTML = p.dataset.original; // Restore
        }
    });
}

// --- Feature: Clutter-Free Reader ---
function toggleClutterFree(isActive) {
    state.clutterFree = isActive;
    if (isActive) document.body.classList.add('neuroflow-clutter-free');
    else document.body.classList.remove('neuroflow-clutter-free');
}

// --- Feature: Panic Button Routine ---
function triggerPanicRoutine() {
    const overlay = document.createElement('div');
    overlay.id = 'neuroflow-panic-overlay';
    overlay.innerHTML = `
        <div class="breathing-circle"></div>
        <h2 style="margin-top: 30px; font-size: 24px;">Breathe In... Breathe Out...</h2>
        <button id="panic-reset-btn" style="margin-top: 20px; padding: 10px 20px; background: transparent; border: 2px solid white; color: white; border-radius: 20px; cursor: pointer;">I'm Ready to Focus</button>
    `;
    document.body.appendChild(overlay);
    document.getElementById('panic-reset-btn').addEventListener('click', () => overlay.remove());
}

// --- Feature: Phonetic Auto-Complete (Input Listener) ---
let typingTimer;
document.addEventListener('input', (e) => {
    // Only run on editable text areas
    if (e.target.tagName === 'TEXTAREA' || e.target.isContentEditable || e.target.tagName === 'INPUT') {
        clearTimeout(typingTimer);
        const text = e.target.value || e.target.innerText;
        
        // Wait for user to stop typing for 500ms (debounce)
        typingTimer = setTimeout(() => {
            // Send last few words to background script for "analysis"
            const lastWords = text.split(' ').slice(-5).join(' ');
            chrome.runtime.sendMessage({ action: "ANALYZE_TEXT", text: lastWords });
        }, 500);
    }
});

// Listen for suggestions back from background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "SHOW_SUGGESTION") {
        showSuggestionBubble(request.suggestion);
    }
});

let bubble;
function showSuggestionBubble(text) {
    if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'neuroflow-suggestion-bubble';
        document.body.appendChild(bubble);
    }
    bubble.innerText = "💡 Suggestion: " + text;
    // Simple positioning near the center bottom for the demo. 
    // Real implementation requires complex cursor tracking logic.
    bubble.style.bottom = "50px";
    bubble.style.left = "50%";
    bubble.style.display = 'block';

    setTimeout(() => bubble.style.display = 'none', 5000); // Hide after 5s
}