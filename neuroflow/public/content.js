// src/content.js

// ==============================================
// 1. BIONIC READING ENGINE
// ==============================================
function toggleBionicReader(active) {
    const content = document.querySelectorAll('p, li, h1, h2, h3, h4, span, div');
    
    content.forEach(element => {
        if (element.closest('#neuroflow-editor-widget') || element.offsetParent === null) return;

        if (active) {
            if (!element.dataset.nfOriginal) {
                element.dataset.nfOriginal = element.innerHTML;
            }
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
            let node;
            const nodesToReplace = [];
            while (node = walker.nextNode()) {
                if (node.nodeValue.trim().length > 0) nodesToReplace.push(node);
            }
            nodesToReplace.forEach(node => {
                const span = document.createElement('span');
                span.innerHTML = processBionicWord(node.nodeValue);
                if (node.parentNode) node.parentNode.replaceChild(span, node);
            });
        } else {
            if (element.dataset.nfOriginal) {
                element.innerHTML = element.dataset.nfOriginal;
                delete element.dataset.nfOriginal;
            }
        }
    });
}

function processBionicWord(text) {
    return text.split(' ').map(word => {
        if (word.length < 2) return word;
        const mid = Math.ceil(word.length / 2);
        return `<b>${word.slice(0, mid)}</b>${word.slice(mid)}`;
    }).join(' ');
}

// ==============================================
// 2. EDITOR OVERLAY (UPDATED UI)
// ==============================================
let editorWidget = null;

function toggleEditorWidget(active) {
    if (active) {
        if (!editorWidget) createEditorWidget();
        editorWidget.style.display = 'flex';
    } else {
        if (editorWidget) editorWidget.style.display = 'none';
    }
}

function createEditorWidget() {
    editorWidget = document.createElement('div');
    editorWidget.id = 'neuroflow-editor-widget';
    
    const shadow = editorWidget.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.className = 'widget-container';
    
    // UI: Input on top, Suggestion Box on bottom
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
        .widget-container { 
            position: fixed; bottom: 20px; right: 20px; width: 340px; height: 450px; 
            background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
            display: flex; flex-direction: column; font-family: sans-serif; border: 2px solid #6366f1; z-index: 2147483647; 
        }
        .header { background: #6366f1; color: white; padding: 12px; border-radius: 10px 10px 0 0; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        #close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem; }
        .content { flex: 1; padding: 12px; border-bottom: 1px solid #eee; }
        textarea { width: 100%; height: 100%; border: none; outline: none; resize: none; background: transparent; font-size: 16px; font-family: sans-serif; color: #333; }
        .suggestion-area { height: 120px; background: #f8fafc; padding: 12px; border-radius: 0 0 12px 12px; display: flex; flex-direction: column; }
        .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 5px; }
        .ghost-text { color: #2563eb; font-size: 16px; font-weight: 500; flex: 1; overflow-y: auto; white-space: pre-wrap; }
        .status-text { font-size: 10px; color: #cbd5e1; text-align: right; margin-top: 5px; }
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);
    document.body.appendChild(editorWidget);

    shadow.getElementById('close-btn').onclick = () => editorWidget.style.display = 'none';

    // --- AI LOGIC ---
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
                    // Try to send to Side Panel
                    await chrome.runtime.sendMessage({ action: "ANALYZE_TEXT_REQUEST", text: text });
                    status.innerText = "Sent";
                } catch (err) {
                    // IF SIDE PANEL IS CLOSED
                    status.innerText = "⚠️ Open Side Panel!";
                    ghost.innerText = "Error: Please open the NeuroFlow Side Panel to start the AI.";
                }
            }
        }, 500);
    });

    // Accept Suggestion (Tab)
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
// ==============================================
// 4. MAIN LISTENER
// ==============================================
chrome.runtime.onMessage.addListener((request) => {
    switch (request.action) {
        case "TOGGLE_BIONIC": toggleBionicReader(request.value); break;
        case "TOGGLE_CLUTTER_FREE": document.body.classList.toggle('neuroflow-clutter-free', request.value); break;
        case "TOGGLE_EDITOR": toggleEditorWidget(request.value); break;
        case "TRIGGER_PANIC_AI": triggerPanicRoutine(request.value); break;
    }
});