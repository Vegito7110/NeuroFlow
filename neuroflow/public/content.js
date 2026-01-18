// src/content.js

// 1. BIONIC READING (Non-Destructive & Safe)
// ==============================================
// 1. BIONIC READING ENGINE (Robust Version)
// ==============================================
const processedNodes = new WeakSet();

function toggleBionicReading(enable) {
    console.log(`NeuroFlow: Bionic Reading set to ${enable}`);
    if (enable) {
        applyBionicReading(document.body);
    } else {
        removeBionicReading();
    }
}

function applyBionicReading(element) {
    // Safety check: Don't run if element is missing
    if (!element) return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];

    while ((node = walker.nextNode())) {
        // --- 1. SKIP CHECKS ---
        if (!node.nodeValue || !node.parentElement) continue;
        
        // Skip already processed nodes
        if (processedNodes.has(node)) continue;

        // Skip restricted tags (Script, Style, Code blocks, etc.)
        const parentTag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'SVG', 'IMG'].includes(parentTag)) {
            continue;
        }

        // CRITICAL FIX: Don't re-bionic existing bionic text (Prevents recursive breaking)
        if (node.parentElement.classList.contains('neuroflow-bionic-word')) {
            continue;
        }

        // Skip editable areas (like text editors)
        if (node.parentElement.isContentEditable) continue;

        // Ensure it has actual text content
        if (node.nodeValue.trim().length === 0) continue;

        nodesToReplace.push(node);
    }

    // --- 2. APPLY CHANGES ---
    nodesToReplace.forEach((textNode) => {
        try {
            const words = textNode.nodeValue.split(' ');
            const fragment = document.createDocumentFragment();

            words.forEach((word, index) => {
                if (word.trim().length > 0) {
                    // Logic: Bold the first half of the word
                    const splitIndex = Math.ceil(word.length / 2);
                    const boldPart = word.slice(0, splitIndex);
                    const normalPart = word.slice(splitIndex);

                    const bionicSpan = document.createElement('span');
                    bionicSpan.className = 'neuroflow-bionic-word'; 
                    bionicSpan.style.fontWeight = '700'; // Inline style ensures it works even if CSS fails
                    bionicSpan.textContent = boldPart;

                    const normalNode = document.createTextNode(normalPart);

                    fragment.appendChild(bionicSpan);
                    fragment.appendChild(normalNode);
                } else {
                    fragment.appendChild(document.createTextNode(word));
                }

                // Restore spaces
                if (index < words.length - 1) {
                    fragment.appendChild(document.createTextNode(' '));
                }
            });

            // Replace the original node
            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(fragment, textNode);
                processedNodes.add(textNode);
            }
        } catch (err) {
            console.warn("NeuroFlow: Skipped a node due to error", err);
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

            // Merge with the next text node if it exists (the unbolded part)
            if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                restoredText += nextSibling.nodeValue;
                parent.removeChild(nextSibling);
            }

            const textNode = document.createTextNode(restoredText);
            parent.replaceChild(textNode, span);
        } catch (err) {
            console.warn("NeuroFlow: Error removing node", err);
        }
    });
    
    // Clean up adjacent text nodes we created
    document.body.normalize(); 
}
// 2. EDITOR OVERLAY (Safe Z-Index)
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
    // Ensure visibility
    editorWidget.style.position = 'fixed';
    editorWidget.style.bottom = '20px';
    editorWidget.style.right = '20px';
    editorWidget.style.zIndex = '2147483647';
    editorWidget.style.display = 'block';

    const shadow = editorWidget.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.innerHTML = `
        <div class="header"><span>🧠 NeuroFlow</span><button id="close-btn">×</button></div>
        <div class="content"><textarea placeholder="Type here..." id="nf-input"></textarea></div>
        <div class="suggestion-area"><div class="label">AI Suggestion (Press Tab to Accept):</div><div id="nf-ghost" class="ghost-text"></div><div id="nf-status" class="status-text">Ready</div></div>
    `;
    const style = document.createElement('style');
    style.textContent = `.widget-container { width: 340px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; font-family: sans-serif; border: 2px solid #6366f1; } .header { background: #6366f1; color: white; padding: 12px; border-radius: 10px 10px 0 0; font-weight: bold; display: flex; justify-content: space-between; align-items: center; } #close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem; } .content { flex: 1; padding: 12px; border-bottom: 1px solid #eee; } textarea { width: 100%; height: 100%; border: none; outline: none; resize: none; background: transparent; font-size: 16px; font-family: sans-serif; color: #333; } .suggestion-area { height: 120px; background: #f8fafc; padding: 12px; border-radius: 0 0 12px 12px; display: flex; flex-direction: column; } .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 5px; } .ghost-text { color: #2563eb; font-size: 16px; font-weight: 500; flex: 1; overflow-y: auto; white-space: pre-wrap; } .status-text { font-size: 10px; color: #cbd5e1; text-align: right; margin-top: 5px; }`;
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

// 3. PANIC OVERLAY
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

// 4. MAIN LISTENER
chrome.runtime.onMessage.addListener((request) => {
    switch (request.action) {
        case "TOGGLE_BIONIC": toggleBionicReading(request.value); break;
        case "TOGGLE_CLUTTER_FREE": document.body.classList.toggle('neuroflow-clutter-free', request.value); break;
        case "TOGGLE_EDITOR": toggleEditorWidget(request.value); break;
        case "TRIGGER_PANIC_AI": triggerPanicRoutine(request.value); break;
    }
});