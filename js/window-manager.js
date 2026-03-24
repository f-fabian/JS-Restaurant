// window-manager.js — spawns and manages floating HTML windows over the canvas.

const MIN_W = 160;
const MIN_H = 80;

// 8 resize handles: direction string encodes which edges move.
// e = right edge,  w = left edge,  s = bottom edge,  n = top edge.
const RESIZE_HANDLES = [
    { dir: 'n',  cursor: 'n-resize'  },
    { dir: 'ne', cursor: 'ne-resize' },
    { dir: 'e',  cursor: 'e-resize'  },
    { dir: 'se', cursor: 'se-resize' },
    { dir: 's',  cursor: 's-resize'  },
    { dir: 'sw', cursor: 'sw-resize' },
    { dir: 'w',  cursor: 'w-resize'  },
    { dir: 'nw', cursor: 'nw-resize' },
];

export class WindowManager {

    constructor() {
        this._z       = 100100;
        this._windows = new Set();

        this._taskbar    = document.createElement('div');
        this._taskbar.id = 'wm-taskbar';
        document.body.appendChild(this._taskbar);

        window.addEventListener('resize', () => {
            this._windows.forEach(win => this._clamp(win));
        });
    }

    // ── Public API ────────────────────────────────────────────────────

    spawn({ title = 'Window', x = 120, y = 80, width = 320, height = 260 } = {}) {
        const win = document.createElement('div');
        win.className    = 'wm-window';
        win.style.left   = `${x}px`;
        win.style.top    = `${y}px`;
        win.style.width  = `${width}px`;
        win.style.height = `${height}px`;
        win.style.zIndex = ++this._z;

        // ── Title bar ──────────────────────────────────────────────
        const bar = document.createElement('div');
        bar.className = 'wm-titlebar';

        const titleEl = document.createElement('span');
        titleEl.className   = 'wm-title';
        titleEl.textContent = title;

        bar.addEventListener('dblclick', e => {
            if (e.target.closest('.wm-btn')) return;
            this._editTitle(bar, titleEl);
        });

        const controls = document.createElement('div');
        controls.className = 'wm-controls';

        const minBtn   = this._makeBtn('−', 'wm-btn-min');
        const closeBtn = this._makeBtn('×', 'wm-btn-close');

        controls.append(minBtn, closeBtn);
        bar.append(titleEl, controls);

        // ── Content area ───────────────────────────────────────────
        const content = document.createElement('div');
        content.className = 'wm-content';

        win.append(bar, content);
        document.body.appendChild(win);

        // ── Behaviours ─────────────────────────────────────────────
        this._windows.add(win);
        this._makeDraggable(win, bar);
        this._makeResizable(win);
        this._makeFocusable(win);
        this._wireMinimize(win, content, minBtn, height);

        closeBtn.addEventListener('click', () => {
            win.style.display = 'none';
            this._addTaskbarPill(win, titleEl);
        });

        requestAnimationFrame(() => this._clamp(win));

        return { win, content };
    }

    // ── Private helpers ───────────────────────────────────────────────

    _makeBtn(label, cls) {
        const btn = document.createElement('button');
        btn.className   = `wm-btn ${cls}`;
        btn.textContent = label;
        return btn;
    }

    _addTaskbarPill(win, titleEl) {
        const pill = document.createElement('button');
        pill.className   = 'wm-taskbar-pill';
        pill.textContent = titleEl.textContent;

        pill.addEventListener('click', () => {
            win.style.display = '';
            win.style.zIndex  = ++this._z;
            this._clamp(win);
            pill.remove();
        });

        this._taskbar.appendChild(pill);
    }

    _editTitle(bar, titleEl) {
        const input = document.createElement('input');
        input.className = 'wm-title-input';
        input.value     = titleEl.textContent;
        bar.replaceChild(input, titleEl);
        input.focus();
        input.select();

        const commit = () => {
            titleEl.textContent = input.value.trim() || titleEl.textContent;
            if (input.parentNode === bar) bar.replaceChild(titleEl, input);
        };

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter')  input.blur();
            if (e.key === 'Escape') { input.value = titleEl.textContent; input.blur(); }
        });
    }

    _wireMinimize(win, content, btn, originalHeight) {
        let minimized       = false;
        let originalDisplay = null;

        btn.addEventListener('click', () => {
            if (originalDisplay === null) {
                originalDisplay = content.style.display || '';
            }

            minimized = !minimized;

            if (minimized) {
                content.style.display = 'none';
                win.style.height      = '';
            } else {
                content.style.display = originalDisplay;
                win.style.height      = `${originalHeight}px`;
                requestAnimationFrame(() =>
                    window.dispatchEvent(new Event('resize'))
                );
            }

            btn.textContent = minimized ? '+' : '−';
        });
    }

    _makeFocusable(win) {
        win.addEventListener('pointerdown', () => {
            win.style.zIndex = ++this._z;
        }, { capture: true });
    }

    _makeDraggable(win, handle) {
        let ox = 0, oy = 0, startL = 0, startT = 0;

        handle.addEventListener('pointerdown', e => {
            if (e.target.closest('.wm-btn') || e.target.tagName === 'INPUT') return;

            ox     = e.clientX;
            oy     = e.clientY;
            startL = parseInt(win.style.left) || 0;
            startT = parseInt(win.style.top)  || 0;

            handle.setPointerCapture(e.pointerId);
            handle.classList.add('wm-dragging');
        });

        handle.addEventListener('pointermove', e => {
            if (!handle.hasPointerCapture(e.pointerId)) return;
            win.style.left = `${startL + e.clientX - ox}px`;
            win.style.top  = `${startT + e.clientY - oy}px`;
            this._clamp(win);
        });

        handle.addEventListener('pointerup', e => {
            if (handle.hasPointerCapture(e.pointerId)) {
                handle.releasePointerCapture(e.pointerId);
                handle.classList.remove('wm-dragging');
            }
        });
    }

    _makeResizable(win) {
        RESIZE_HANDLES.forEach(({ dir, cursor }) => {
            const el = document.createElement('div');
            el.className        = `wm-resize-handle wm-resize-${dir}`;
            el.style.cursor     = cursor;
            win.appendChild(el);

            let startX, startY, startW, startH, startL, startT;

            el.addEventListener('pointerdown', e => {
                e.stopPropagation(); // don't trigger drag or focus-bump twice

                startX = e.clientX;
                startY = e.clientY;
                startW = win.offsetWidth;
                startH = win.offsetHeight;
                startL = parseInt(win.style.left) || 0;
                startT = parseInt(win.style.top)  || 0;

                el.setPointerCapture(e.pointerId);
                e.preventDefault();
            });

            el.addEventListener('pointermove', e => {
                if (!el.hasPointerCapture(e.pointerId)) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                let w = startW, h = startH, l = startL, t = startT;

                if (dir.includes('e')) w = Math.max(MIN_W, startW + dx);
                if (dir.includes('s')) h = Math.max(MIN_H, startH + dy);
                if (dir.includes('w')) {
                    w = Math.max(MIN_W, startW - dx);
                    l = startL + startW - w;
                }
                if (dir.includes('n')) {
                    h = Math.max(MIN_H, startH - dy);
                    t = startT + startH - h;
                }

                // Clamp position to viewport
                l = Math.max(0, Math.min(l, window.innerWidth  - w));
                t = Math.max(0, Math.min(t, window.innerHeight - h));

                win.style.width  = `${w}px`;
                win.style.height = `${h}px`;
                win.style.left   = `${l}px`;
                win.style.top    = `${t}px`;
            });

            el.addEventListener('pointerup', e => {
                if (el.hasPointerCapture(e.pointerId)) {
                    el.releasePointerCapture(e.pointerId);
                    // Notify size-aware children (e.g. CodeMirror) once resize ends.
                    window.dispatchEvent(new Event('resize'));
                }
            });
        });
    }

    _clamp(win) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        win.style.left = `${Math.min(Math.max(0, parseInt(win.style.left) || 0), vw - win.offsetWidth)}px`;
        win.style.top  = `${Math.min(Math.max(0, parseInt(win.style.top)  || 0), vh - win.offsetHeight)}px`;
    }
}
