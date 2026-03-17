// code-editor.js — thin wrapper around CodeMirror 6.
//
// Imported from CDN (esm.sh) — no build step needed.
// Provides: JS syntax highlighting, line numbers, active-line highlight.

import { EditorView, basicSetup }       from 'https://esm.sh/codemirror@6';
import { javascript }                   from 'https://esm.sh/@codemirror/lang-javascript@6';
import { EditorState }                  from 'https://esm.sh/@codemirror/state@6';
import { keymap }                       from 'https://esm.sh/@codemirror/view@6';
import { defaultKeymap, historyKeymap } from 'https://esm.sh/@codemirror/commands@6';

/**
 * Mount a CodeMirror 6 editor inside `parent`.
 *
 * @param {HTMLElement} parent      - Container element (wm-content div).
 * @param {string}      initialCode - Starting source code.
 * @returns {EditorView}            - CM6 view instance (use .state.doc.toString() to read code).
 */
export function createCodeEditor(parent, initialCode = '') {
    // Make this zone transparent so the canvas shows through.
    // Title bar and button bar live outside this element and stay solid.
    parent.style.padding    = '0';
    parent.style.overflow   = 'hidden';
    parent.style.background = 'transparent';

    const view = new EditorView({
        state: EditorState.create({
            doc: initialCode,
            extensions: [
                basicSetup,
                javascript(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                EditorView.theme({
                    '&': {
                        height: '100%',
                        fontSize: '13px',
                        fontFamily: '"Fira Code", "Cascadia Code", monospace',
                        background: 'transparent',
                    },
                    '.cm-scroller': { overflow: 'auto', background: 'transparent' },
                    '.cm-content':  { caretColor: '#0f0', background: 'transparent' },
                    '.cm-gutters': {
                        background: 'rgba(20, 20, 20, 0.55)',
                        borderRight: '1px solid rgba(80,80,80,0.4)',
                        color: '#666',
                    },
                    '.cm-activeLineGutter': { background: 'rgba(37,37,37,0.8)', color: '#aaa' },
                    '.cm-activeLine':       { background: 'rgba(30,42,30,0.75)' },
                    '.cm-selectionBackground': { background: '#264f78 !important' },
                    '.cm-cursor': { borderLeftColor: '#0f0' },
                }),
                EditorView.editable.of(true),
            ],
        }),
        parent,
    });

    // Direct DOM override — CM6 theme specificity can be beaten by injected
    // styles from basicSetup. Setting inline styles guarantees transparency.
    requestAnimationFrame(() => {
        const cm = view.dom;
        cm.style.background = 'transparent';
        cm.querySelectorAll('.cm-scroller, .cm-content').forEach(el => {
            el.style.background = 'transparent';
        });
    });

    return view;
}
