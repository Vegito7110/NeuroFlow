// src/content.js

// ==============================================
// 1. BIONIC READING ENGINE
// ==============================================
function toggleBionicReader(active) {
    const content = document.querySelectorAll('p, li, h1, h2, h3, h4, span, div');
    
    content.forEach(element => {
        // Skip our own widget and invisible elements
        if (element.closest('#neuroflow-editor-widget') || 
            element.closest('#neuroflow-tunnel') ||
            element.offsetParent === null) return;

        if (active) {
            // Save original text if not saved
            if (!element.dataset.nfOriginal) {
                element.dataset.nfOriginal = element.innerHTML;
            }

            // Process text nodes only to avoid breaking HTML tags
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
            let node;
            const nodesToReplace = [];

            while (node = walker.nextNode()) {
                if (node.nodeValue.trim().length > 0) {
                    nodesToReplace.push(node);
                }
            }

            nodesToReplace.forEach(node => {
                const span = document.createElement('span');
                span.innerHTML = processBionicWord(node.nodeValue);
                if (node.parentNode) {
                    node.parentNode.replaceChild(span, node);
                }
            });

        } else {
            // Restore original text
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
// 2. FOCUS TUNNEL (VIGNETTE MODE)
// ==============================================
let tunnelOverlay = null;

function toggleFocusTunnel(active) {
    if (active) {
        if (!tunnelOverlay) {
            tunnelOverlay = document.createElement('div');
            tunnelOverlay.id = 'neuroflow-tunnel';
            Object.assign(tunnelOverlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                pointerEvents: 'none', zIndex: '2147483646',
                mixBlendMode: 'multiply', transition: 'background 0.1s ease'
            });
            document.body.appendChild(tunnelOverlay);
            document.addEventListener('mousemove', updateTunnelPosition);
        }
        tunnelOverlay.style.display = 'block';
    } else {
        if (tunnelOverlay) {
            tunnelOverlay.style.display = 'none';
            document.removeEventListener('mousemove', updateTunnelPosition);
        }
    }
}

function updateTunnelPosition(e) {
    if (!tunnelOverlay) return;
    tunnelOverlay.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, transparent 150px, rgba(0,0,0,0.85) 400px)`;
}

// ==============================================
// 3. EDITOR OVERLAY
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
    container.innerHTML = `
        <div class="header">
            <span>🧠 NeuroFlow</span>
            <button id="close-btn">×</button>
        </div>
        <div class="content">
            <textarea placeholder="Type here... (Phonetic AI active)" id="nf-input"></textarea>
            <div id="nf-ghost" class="ghost-text"></div>
        </div>
        <div class="footer"><span id="status">AI Ready</span></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .widget-container { position: fixed; bottom: 20px; right: 20px; width: 320px; height: 400px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; font-family: sans-serif; border: 2px solid #6366f1; z-index: 2147483647; }
        .header { background: #6366f1; color: white; padding: 10px; border-radius: 10px 10px 0 0; font-weight: bold; display: flex; justify-content: space-between; }
        #close-btn { background:none; border:none; color:white; cursor: pointer; font-size: 1.5rem; }
        .content { position: relative; flex: 1; padding: 10px; }
        textarea { width: 100%; height: 100%; border: none; outline: none; resize: none; background: transparent; position: relative; z-index: 2; font-size: 16px; font-family: sans-serif; }
        .ghost-text { position: absolute; top: 10px; left: 10px; color: #aaa; z-index: 1; pointer-events: none; font-size: 16px; font-family: sans-serif; white-space: pre-wrap; }
        .footer { padding: 8px; border-top: 1px solid #eee; font-size: 12px; color: #666; background: #fff; border-radius: 0 0 12px 12px; }
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);
    document.body.appendChild(editorWidget);

    shadow.getElementById('close-btn').onclick = () => editorWidget.style.display = 'none';

    // AI Logic
    const input = shadow.getElementById('nf-input');
    const ghost = shadow.getElementById('nf-ghost');
    let typingTimer;

    input.addEventListener('input', (e) => {
        const text = e.target.value;
        ghost.innerText = "";
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (text.length > 3 && chrome.runtime?.id) {
                chrome.runtime.sendMessage({ action: "ANALYZE_TEXT_REQUEST", text: text });
            }
        }, 500);
    });

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "SHOW_PREDICTION" && request.value) {
            ghost.innerText = request.value;
        }
    });
}

// ==============================================
// 4. MAIN MESSAGE LISTENER
// ==============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "TOGGLE_BIONIC":
            toggleBionicReader(request.value);
            break;
        case "TOGGLE_CLUTTER_FREE":
            document.body.classList.toggle('neuroflow-clutter-free', request.value);
            break;
        case "TOGGLE_FOCUS_TUNNEL":
            toggleFocusTunnel(request.value);
            break;
        case "TOGGLE_EDITOR":
            toggleEditorWidget(request.value);
            break;
        case "TRIGGER_PANIC_AI":
            alert("Panic Mode Activated: Take a deep breath. Focus reset initiated.");
            break;
    }
});