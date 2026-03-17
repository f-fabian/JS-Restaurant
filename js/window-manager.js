// window-manager.js — spawns and manages floating HTML windows over the canvas.

export class WindowManager {

    constructor() {
        this._z       = 200;
        this._windows = new Set();

        // Taskbar — holds restore pills for closed windows (bottom-left)
        this._taskbar = document.createElement('div');
        this._taskbar.id = 'wm-taskbar';
        document.body.appendChild(this._taskbar);

        // Keep every open window inside the viewport on resize.
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

        // dblclick on the whole bar (setPointerCapture redirects events to bar,
        // so a listener on titleEl alone would never fire).
        bar.addEventListener('dblclick', e => {
            if (e.target.closest('.wm-btn')) return;
            this._editTitle(bar, titleEl);
        });

        // ── Control buttons ────────────────────────────────────────
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
        let minimized = false;
        btn.addEventListener('click', () => {
            minimized = !minimized;
            content.style.display = minimized ? 'none' : '';
            win.style.height      = minimized ? '' : `${originalHeight}px`;
            btn.textContent       = minimized ? '+' : '−';
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
            // No e.preventDefault() — it would suppress dblclick on titleEl.
            // user-select:none in CSS already prevents text selection.
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

    _clamp(win) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w  = win.offsetWidth;
        const h  = win.offsetHeight;

        win.style.left = `${Math.min(Math.max(0, parseInt(win.style.left) || 0), vw - w)}px`;
        win.style.top  = `${Math.min(Math.max(0, parseInt(win.style.top)  || 0), vh - h)}px`;
    }
}
