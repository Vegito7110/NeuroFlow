// ============================================================================
// NEUROFLOW - CONTENT SCRIPT (FINAL)
// Features: Bionic Reading, Smart Reader (Dyslexia Support), Panic Mode, AI Auto-Complete
// ============================================================================

// --- GLOBAL STATE ---
let bionicProcessed = false; 
let currentFontSize = 19; // Default font size for Reader Mode

// ============================================================================
// 1. PERSISTENCE & INITIALIZATION
// ============================================================================
// Checks saved settings immediately on page load to restore state.
if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["settings_bionic", "settings_clutter"], (result) => {
        if (result.settings_bionic) {
            toggleBionicReading(true);
        }
        if (result.settings_clutter) {
            toggleSensorySafeMode(true);
        }
    });
}

// ============================================================================
// 2. MESSAGE LISTENER (The Bridge to React)
// ============================================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "TOGGLE_BIONIC":
            toggleBionicReading(request.data.value); 
            break;
        case "TOGGLE_CLUTTER_FREE":
            toggleSensorySafeMode(request.data.value); 
            break;
        case "TRIGGER_PANIC":
            triggerPanicRoutine(request.data); 
            break;
    }
});


// ============================================================================
// FEATURE A: BIONIC READING (Optimized)
// ============================================================================
function toggleBionicReading(isActive) {
    // OPTIMIZATION: Process the DOM only once. 
    // If toggled off/on, we just switch the CSS class, we don't re-parse.
    if (isActive && !bionicProcessed) {
        processBionicDOM();
        bionicProcessed = true;
    }

    if (isActive) {
        document.body.classList.add('neuroflow-bionic-active');
    } else {
        document.body.classList.remove('neuroflow-bionic-active');
    }
}

function processBionicDOM() {
    // Use TreeWalker for high-performance iteration
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) {
        const parentTag = node.parentNode.tagName;
        // Skip script, style, textarea, and tiny text fragments
        if (!['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parentTag)) {
             if (node.nodeValue.trim().length > 2) { 
                 textNodes.push(node);
             }
        }
    }

    textNodes.forEach(textNode => {
        const words = textNode.nodeValue.split(" ");
        // Skip single letter/empty nodes
        if (words.length < 2) return; 

        const transformed = words.map(word => {
            if (word.length < 3) return word;
            const mid = Math.ceil(word.length / 2);
            // Wrap the first half in a bold tag with our specific class
            return `<b class="neuroflow-bionic-text">${word.slice(0, mid)}</b>${word.slice(mid)}`;
        }).join(" ");

        const span = document.createElement("span");
        span.innerHTML = transformed;
        textNode.parentNode.replaceChild(span, textNode);
    });
}


// ============================================================================
// FEATURE B: SMART READER MODE (The "Clean Room")
// ============================================================================
function toggleSensorySafeMode(isActive) {
    const readerId = 'neuroflow-reader-view';
    let reader = document.getElementById(readerId);

    if (isActive) {
        if (!reader) {
            reader = document.createElement('div');
            reader.id = readerId;
            
            // 1. Create Toolbar (Added Width Toggle)
            const toolbar = document.createElement('div');
            toolbar.id = 'neuroflow-reader-toolbar';
            toolbar.innerHTML = `
                <button class="nf-tool-btn" id="nf-font-down" title="Decrease Font">A-</button>
                <button class="nf-tool-btn" id="nf-font-up" title="Increase Font">A+</button>
                
                <div style="width: 1px; height: 20px; background:#ccc; margin:0 8px;"></div>
                
                <button class="nf-tool-btn" id="nf-width-toggle" title="Toggle Width">↔ Width</button>
                <button class="nf-tool-btn" id="nf-dyslexia-toggle" title="Dyslexia Font">🔤 Dyslexia</button>
                <button class="nf-tool-btn" id="nf-theme-toggle" title="Dark/Light Mode">🌗 Theme</button>
                
                <button class="nf-tool-btn nf-close-btn" id="nf-close">Exit</button>
            `;

            const contentContainer = document.createElement('div');
            contentContainer.id = 'neuroflow-reader-content';

            // 2. Extract & Clean
            const mainContent = detectMainContent();
            if (mainContent) {
                const clonedContent = mainContent.cloneNode(true);
                cleanReaderContent(clonedContent);
                contentContainer.appendChild(clonedContent);
            } else {
                contentContainer.innerHTML = "<h2 style='text-align:center'>Reader View</h2><p style='text-align:center'>Could not auto-detect main article. Please try selecting text.</p>";
            }

            reader.appendChild(toolbar);
            reader.appendChild(contentContainer);
            document.body.appendChild(reader);

            // 3. Bind Events
            document.getElementById('nf-close').onclick = () => toggleSensorySafeMode(false);
            
            // Font Size
            document.getElementById('nf-font-up').onclick = () => { currentFontSize += 2; updateFontSize(); };
            document.getElementById('nf-font-down').onclick = () => { currentFontSize = Math.max(14, currentFontSize - 2); updateFontSize(); };
            
            // Theme
            document.getElementById('nf-theme-toggle').onclick = () => { document.body.classList.toggle('reader-dark-mode'); };

            // Dyslexia
            document.getElementById('nf-dyslexia-toggle').onclick = (e) => {
                reader.classList.toggle('nf-dyslexic-active');
                e.target.classList.toggle('active');
            };

            // NEW: Width Toggle
            document.getElementById('nf-width-toggle').onclick = (e) => {
                reader.classList.toggle('nf-wide-active');
                e.target.classList.toggle('active');
            };
        }

        setTimeout(() => reader.classList.add('active'), 10);
        document.body.style.overflow = 'hidden'; 

    } else {
        if (reader) reader.classList.remove('active');
        document.body.style.overflow = ''; 
    }
}

// Helper: Update Font Size dynamically
function updateFontSize() {
    const container = document.getElementById('neuroflow-reader-content');
    if (container) {
        container.querySelectorAll('p, li, h1, h2, h3, h4').forEach(el => {
            el.style.fontSize = currentFontSize + "px";
        });
    }
}

// --- ALGORITHM 1: SCORING (Find the content) ---
function detectMainContent() {
    // 1. Check ARIA roles first (Best accuracy)
    const article = document.querySelector('article');
    if (article) return article;

    // 2. Heuristic Scoring
    const candidates = document.querySelectorAll('div, section, main, td');
    let bestCandidate = document.body;
    let maxScore = 0;

    candidates.forEach(node => {
        // Ignore hidden or tiny elements
        if (!node.offsetParent || node.innerText.length < 200) return;

        let score = 0;
        const paragraphs = node.querySelectorAll('p');
        
        // Points for paragraphs
        score += paragraphs.length * 10;
        // Points for total text length
        score += Math.log(node.innerText.length) * 5;
        // Points for Commas (High signal for sentences vs menus)
        const commas = (node.innerText.match(/,/g) || []).length;
        score += commas * 3;
        
        // Deduct points for high link density (Navigation/Footer)
        const linkCount = node.querySelectorAll('a').length;
        if (linkCount > 0 && (node.innerText.length / linkCount) < 50) {
            score -= 50; 
        }

        if (score > maxScore) {
            maxScore = score;
            bestCandidate = node;
        }
    });
    return bestCandidate;
}

// --- ALGORITHM 2: CLEANING (Strip the junk) ---
function cleanReaderContent(rootNode) {
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT, null);
    const nodesToRemove = [];
    const badTags = ['SCRIPT', 'STYLE', 'FORM', 'BUTTON', 'NAV', 'IFRAME', 'SVG', 'NOSCRIPT', 'HEADER', 'FOOTER'];
    const badClasses = ['ad', 'comment', 'promo', 'social', 'hidden', 'sidebar', 'popup', 'newsletter'];

    let node = walker.nextNode();
    while (node) {
        const tagName = node.tagName;
        const className = (node.className || "").toString().toLowerCase();

        // Mark for deletion if tag is bad OR class is suspicious
        if (badTags.includes(tagName) || badClasses.some(bad => className.includes(bad))) {
            nodesToRemove.push(node);
        } else {
            // Critical: Remove inline styles to allow our CSS to take over
            node.removeAttribute('style');
            node.removeAttribute('width');
            node.removeAttribute('height');
        }
        node = walker.nextNode();
    }

    // Delete marked nodes (Backwards loop to preserve tree integrity)
    for (let i = nodesToRemove.length - 1; i >= 0; i--) {
        if (nodesToRemove[i].parentNode) {
            nodesToRemove[i].parentNode.removeChild(nodesToRemove[i]);
        }
    }
}


// ============================================================================
// FEATURE C: PANIC MODE (AI Connected)
// ============================================================================
function triggerPanicRoutine(aiData) {
    // 1. Clean up existing overlays
    const old = document.getElementById('neuroflow-panic-overlay');
    if (old) old.remove();

    // 2. Prepare Data (AI or Default)
    const message = aiData?.calming_message || "Deep Breath In...";
    const step = aiData?.micro_step || "Just close your eyes for 5 seconds.";

    // 3. Create Overlay DOM
    const overlay = document.createElement("div");
    overlay.id = "neuroflow-panic-overlay";
    overlay.innerHTML = `
        <div class="neuroflow-breathing-circle"></div>
        <h2 style="color:#1e293b; margin: 0 0 10px 0; font-size: 32px; text-align:center; font-weight:700;">${message}</h2>
        <p style="font-size:20px; color:#64748b; text-align:center; max-width: 600px; margin-bottom: 40px; line-height: 1.5;">${step}</p>
        <button id="neuroflow-panic-close" style="
            padding: 15px 40px; 
            background: #3b82f6; 
            border: none; 
            border-radius: 50px; 
            color: white; 
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
            transition: transform 0.2s;
        ">I'm Ready</button>
        <div style="position:absolute; bottom: 30px; font-size: 14px; color: #94a3b8;">Press ESC to close</div>
    `;

    document.body.appendChild(overlay);

    // 4. Activate & Focus
    requestAnimationFrame(() => overlay.classList.add('visible'));
    const closeBtn = document.getElementById("neuroflow-panic-close");
    closeBtn.focus();

    // 5. Close Handlers
    const closeRoutine = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
        document.removeEventListener('keydown', escHandler);
    };

    closeBtn.onclick = closeRoutine;

    // ESC Key Listener (Accessibility)
    const escHandler = (e) => {
        if (e.key === "Escape") closeRoutine();
    };
    document.addEventListener('keydown', escHandler);
}


// ============================================================================
// FEATURE D: PHONETIC AUTO-COMPLETE
// ============================================================================
let typingTimer;

document.addEventListener('input', (e) => {
    // Only listen on editable fields
    if (e.target.tagName === 'TEXTAREA' || e.target.isContentEditable || e.target.tagName === 'INPUT') {
        clearTimeout(typingTimer);
        const text = e.target.value || e.target.innerText;
        
        // Debounce: Wait 500ms after typing stops
        typingTimer = setTimeout(() => {
            const lastWords = text.split(' ').slice(-5).join(' '); // Context: last 5 words
            
            // Send to Background Script (which talks to Python API)
            chrome.runtime.sendMessage(
                { action: "ANALYZE_TEXT", text: lastWords },
                (response) => {
                    // Ignore errors (e.g., if popup is closed or blocked)
                    if (chrome.runtime.lastError) return; 
                    
                    if (response && response.status === "success" && response.suggestion) {
                        showSuggestionBubble(response.suggestion);
                    }
                }
            );
        }, 500);
    }
});

let bubble;
function showSuggestionBubble(text) {
    if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'neuroflow-suggestion-bubble';
        // Styling handled in content.css mostly, but ensure visibility here
        bubble.style.display = 'none'; 
        document.body.appendChild(bubble);
    }
    bubble.innerText = "✨ " + text;
    
    const activeElement = document.activeElement;
    if (activeElement) {
        const rect = activeElement.getBoundingClientRect();
        bubble.style.top = (rect.bottom + window.scrollY + 8) + "px";
        bubble.style.left = (rect.left + window.scrollX) + "px";
        bubble.style.display = 'block';
    }

    // Auto-hide after 5 seconds
    setTimeout(() => bubble.style.display = 'none', 5000);
}