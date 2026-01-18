// src/content.js

// ==============================================
// 1. BIONIC READING ENGINE (Non-Destructive & Safe)
// ==============================================
const processedNodes = new WeakSet();

function toggleBionicReader(enable) {
    if (enable) applyBionicReading(document.body);
    else removeBionicReading();
}

function applyBionicReading(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];

    while ((node = walker.nextNode())) {
        // Skip checks: Script, Style, Editor, and already processed nodes
        if (!node.nodeValue.trim() || processedNodes.has(node) || 
            ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(node.parentElement.tagName) || 
            node.parentElement.isContentEditable || node.parentElement.classList.contains('neuroflow-bionic-word')) {
            continue;
        }
        nodesToReplace.push(node);
    }

    nodesToReplace.forEach((textNode) => {
        try {
            const words = textNode.nodeValue.split(' ');
            const fragment = document.createDocumentFragment();
            words.forEach((word, index) => {
                if (word.trim().length > 0) {
                    // Logic: Bold the first half
                    const splitIndex = Math.ceil(word.length / 2);
                    const bionicSpan = document.createElement('span');
                    bionicSpan.className = 'neuroflow-bionic-word'; 
                    bionicSpan.style.fontWeight = '700';
                    bionicSpan.textContent = word.slice(0, splitIndex);
                    fragment.appendChild(bionicSpan);
                    fragment.appendChild(document.createTextNode(word.slice(splitIndex)));
                } else {
                    fragment.appendChild(document.createTextNode(word));
                }
                if (index < words.length - 1) fragment.appendChild(document.createTextNode(' '));
            });
            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
                processedNodes.add(textNode);
            }
        } catch (e) {}
    });
}

function removeBionicReading() {
    document.querySelectorAll('.neuroflow-bionic-word').forEach((span) => {
        try {
            const parent = span.parentNode;
            if (!parent) return;
            let restoredText = span.textContent;
            const nextSibling = span.nextSibling;
            
            // Merge with the next text node if it exists
            if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                restoredText += nextSibling.nodeValue;
                parent.removeChild(nextSibling);
            }
            parent.replaceChild(document.createTextNode(restoredText), span);
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
    Object.assign(editorWidget.style, { position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647', display: 'block' });
    
    const shadow = editorWidget.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.className = 'widget-container';
    
    container.innerHTML = `
        <div class="header"><span>🧠 NeuroFlow</span><button id="close-btn">×</button></div>
        <div class="content"><textarea placeholder="Type here..." id="nf-input"></textarea></div>
        <div class="suggestion-area"><div class="label">AI Suggestion (Press Tab to Accept):</div><div id="nf-ghost" class="ghost-text"></div><div id="nf-status" class="status-text">Ready</div></div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `.widget-container { width: 340px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; font-family: sans-serif; border: 2px solid #6366f1; } .header { background: #6366f1; color: white; padding: 12px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; } #close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem; } .content { flex: 1; padding: 12px; border-bottom: 1px solid #eee; } textarea { width: 100%; height: 100%; border: none; outline: none; resize: none; background: transparent; font-size: 16px; color: #333; } .suggestion-area { height: 120px; background: #f8fafc; padding: 12px; } .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; } .ghost-text { color: #2563eb; font-size: 16px; font-weight: 500; height: 60px; overflow-y: auto; } .status-text { font-size: 10px; color: #cbd5e1; text-align: right; }`;
    
    shadow.appendChild(style);
    shadow.appendChild(container);
    document.body.appendChild(editorWidget);
    
    shadow.getElementById('close-btn').onclick = () => editorWidget.style.display = 'none';
    
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
        if (e.key === 'Tab' && ghost.innerText.trim().length > 0 && !ghost.innerText.startsWith("Error")) {
            e.preventDefault();
            input.value = ghost.innerText;
            ghost.innerText = "";
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
    const overlay = document.createElement("div");
    overlay.id = "neuroflow-panic-overlay";
    overlay.innerHTML = `<div class="neuroflow-breathing-circle"></div><h2 style="color:#1e293b;margin:10px 0;">Deep Breath...</h2><p style="font-size:20px;color:#64748b;">Just close your eyes for 5 seconds.</p><button id="neuroflow-panic-close" style="padding:15px 40px;background:#3b82f6;color:white;border:none;border-radius:50px;font-size:18px;cursor:pointer;">I'm Ready</button>`;
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
// 4. MAIN LISTENER (Cleaned)
// ==============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "TOGGLE_BIONIC": toggleBionicReader(request.value); break;
        case "TOGGLE_CLUTTER_FREE": document.body.classList.toggle('neuroflow-clutter-free', request.value); break;
        case "TOGGLE_EDITOR": toggleEditorWidget(request.value); break;
        case "TRIGGER_PANIC_AI": triggerPanicRoutine(request.value); break;
    }
    // IMPORTANT: Keep this response to prevent errors
    sendResponse({status: "done"});
    return false;
});