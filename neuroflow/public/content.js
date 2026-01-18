// src/content.js

// ==============================================
// 1. BIONIC READING ENGINE (Non-Destructive & Safe)
// ==============================================
const processedNodes = new WeakSet();

// FIXED: Function name matches the listener call below
function toggleBionicReader(enable) {
    if (enable) {
        applyBionicReading(document.body);
    } else {
        removeBionicReading();
    }
}

function applyBionicReading(element) {
    // Walker to find all text nodes
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    const nodesToReplace = [];

    while ((node = walker.nextNode())) {
        // Skip checks (Script, Style, Editor, etc.)
        if (
            !node.nodeValue.trim() ||
            processedNodes.has(node) ||
            ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(node.parentElement.tagName) ||
            node.parentElement.isContentEditable ||
            node.parentElement.classList.contains('neuroflow-bionic-word')
        ) {
            continue;
        }
        nodesToReplace.push(node);
    }

    // Process nodes
    nodesToReplace.forEach((textNode) => {
        try {
            const words = textNode.nodeValue.split(' ');
            const fragment = document.createDocumentFragment();

            words.forEach((word, index) => {
                if (word.trim().length > 0) {
                    // Logic: Bold the first half
                    const splitIndex = Math.ceil(word.length / 2);
                    const boldPart = word.slice(0, splitIndex);
                    const normalPart = word.slice(splitIndex);

                    const bionicSpan = document.createElement('span');
                    bionicSpan.className = 'neuroflow-bionic-word'; 
                    bionicSpan.style.fontWeight = '700';
                    bionicSpan.textContent = boldPart;

                    const normalNode = document.createTextNode(normalPart);

                    fragment.appendChild(bionicSpan);
                    fragment.appendChild(normalNode);
                } else {
                    fragment.appendChild(document.createTextNode(word));
                }

                if (index < words.length - 1) {
                    fragment.appendChild(document.createTextNode(' '));
                }
            });

            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
                processedNodes.add(textNode); 
            }
        } catch (e) {
            // Ignore individual node errors to prevent crashing
        }
    });
}

function removeBionicReading() {
    const bionicElements = document.querySelectorAll('.neuroflow-bionic-word');

    bionicElements.forEach((span) => {
        try {
            const parent = span.parentNode;
            if (!parent) return;

            const boldText = span.textContent;
            const nextSibling = span.nextSibling;
            let restoredText = boldText;

            // Merge with the next text node
            if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                restoredText += nextSibling.nodeValue;
                parent.removeChild(nextSibling);
            }

            const textNode = document.createTextNode(restoredText);
            parent.replaceChild(textNode, span);
        } catch (e) {}
    });
    
    document.body.normalize(); 
}

// ==============================================
// 2. EDITOR OVERLAY
// ==============================================
let editorWidget = null;

function toggleEditorWidget(active) {
    if (active) {
        if (!editorWidget) createEditorWidget();
        editorWidget.style.display = 'block';
    } else {
        if (editorWidget) editorWidget.style.display = 'none';
    }
}

function createEditorWidget() {
    editorWidget = document.createElement('div');
    editorWidget.id = 'neuroflow-editor-widget';
    // Forced Styles
    editorWidget.style.position = 'fixed';
    editorWidget.style.bottom = '20px';
    editorWidget.style.right = '20px';
    editorWidget.style.zIndex = '2147483647';
    editorWidget.style.display = 'block';

    const shadow = editorWidget.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.className = 'widget-container';
    
    container.innerHTML = `
        <div class="header">
            <span>🧠 NeuroFlow</span>
            <button id="close-btn">×</button>
        </div>
        <div class="content">
            <textarea placeholder="Type here..." id="nf-input"></textarea>
        </div>
        <div class="suggestion-area">
            <div class="label">AI Suggestion (Press Tab to Accept):</div>
            <div id="nf-ghost" class="ghost-text"></div>
            <div id="nf-status" class="status-text">Ready</div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .widget-container { width: 340px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; font-family: sans-serif; border: 2px solid #6366f1; }
        .header { background: #6366f1; color: white; padding: 12px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        #close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem; }
        .content { flex: 1; padding: 12px; }
        textarea { width: 100%; height: 100%; border: none; outline: none; resize: none; font-size: 16px; color: #333; }
        .suggestion-area { height: 100px; background: #f8fafc; padding: 12px; border-top: 1px solid #e2e8f0; }
        .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; }
        .ghost-text { color: #2563eb; font-size: 16px; font-weight: 500; height: 50px; overflow-y: auto; }
        .status-text { font-size: 10px; color: #cbd5e1; text-align: right; }
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);
    document.body.appendChild(editorWidget);

    shadow.getElementById('close-btn').onclick = () => editorWidget.style.display = 'none';

    // AI Logic
    const input = shadow.getElementById('nf-input');
    const ghost = shadow.getElementById('nf-ghost');
    const status = shadow.getElementById('nf-status');
    let typingTimer;

    input.addEventListener('input', (e) => {
        const text = e.target.value;
        status.innerText = "Typing...";
        clearTimeout(typingTimer);
        typingTimer = setTimeout(async () => {
            if (text.length > 3) {
                status.innerText = "Sending to AI...";
                try {
                    await chrome.runtime.sendMessage({ action: "ANALYZE_TEXT_REQUEST", text: text });
                    status.innerText = "Sent";
                } catch (err) {
                    status.innerText = "⚠️ Open Side Panel!";
                    ghost.innerText = "Error: Side Panel Closed.";
                }
            }
        }, 500);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (ghost.innerText.trim().length > 0 && !ghost.innerText.startsWith("Error")) {
                e.preventDefault();
                input.value = ghost.innerText;
                ghost.innerText = "";
            }
        }
    });

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "SHOW_PREDICTION") {
            ghost.innerText = request.value;
            status.innerText = "Suggestion Ready";
        }
    });
}

// ==============================================
// 3. PANIC MODE OVERLAY
// ==============================================
function triggerPanicRoutine(aiData) {
    const old = document.getElementById('neuroflow-panic-overlay');
    if (old) old.remove();

    const message = aiData?.calming_message || "Deep Breath In...";
    const step = aiData?.micro_step || "Just close your eyes for 5 seconds.";

    const overlay = document.createElement("div");
    overlay.id = "neuroflow-panic-overlay";
    overlay.innerHTML = `
        <div class="neuroflow-breathing-circle"></div>
        <h2 style="color:#1e293b; margin: 0 0 10px 0; font-size: 32px; text-align:center; font-weight:700;">${message}</h2>
        <p style="font-size:20px; color:#64748b; text-align:center; max-width: 600px; margin-bottom: 40px; line-height: 1.5;">${step}</p>
        <button id="neuroflow-panic-close" style="padding: 15px 40px; background: #3b82f6; border: none; border-radius: 50px; color: white; font-size: 18px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);">I'm Ready</button>
        <div style="position:absolute; bottom: 30px; font-size: 14px; color: #94a3b8;">Press ESC to close</div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    
    const closeBtn = document.getElementById("neuroflow-panic-close");
    closeBtn.focus();
    
    const closeRoutine = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
        document.removeEventListener('keydown', escHandler);
    };
    
    closeBtn.onclick = closeRoutine;
    const escHandler = (e) => { if (e.key === "Escape") closeRoutine(); };
    document.addEventListener('keydown', escHandler);
}

// ==============================================
// 4. MAIN LISTENER (Fixed Names)
// ==============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "TOGGLE_BIONIC": 
            toggleBionicReader(request.value); // Matches function name above
            break;
        case "TOGGLE_CLUTTER_FREE": 
            document.body.classList.toggle('neuroflow-clutter-free', request.value); 
            break;
        case "TOGGLE_EDITOR": 
            toggleEditorWidget(request.value); 
            break;
        case "TRIGGER_PANIC_AI": 
            triggerPanicRoutine(request.value); 
            break;
    }
    // Optional: Send response to avoid "channel closed" errors
    sendResponse({status: "received"});
});