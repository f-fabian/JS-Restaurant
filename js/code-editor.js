// code-editor.js — thin wrapper around CodeMirror 6.
//
// All CM6 modules come from a single local bundle (js/cm.bundle.min.js)
// built with esbuild — zero duplicate instances, zero CDN issues.

import {
    EditorView, EditorState, keymap,
    lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
    drawSelection, dropCursor, rectangularSelection, crosshairCursor,
    highlightActiveLine, history, defaultKeymap, historyKeymap, indentMore, indentLess,
    syntaxHighlighting, defaultHighlightStyle, indentOnInput,
    bracketMatching, foldGutter, foldKeymap,
    closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap,
    highlightSelectionMatches, searchKeymap, lintKeymap,
    javascript, oneDark,
} from './cm.bundle.min.js';

/* ── Editor font stack ────────────────────────────────────────── */
const editorFont = '"Cascadia Code", "Fira Code", "Consolas", monospace';

/* ── basicSetup equivalent ─────────────────────────────────────── */
const setup = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
        {
            key: 'Tab',
            run(view) {
                const { state } = view;
                const hasMultilineSelection = state.selection.ranges.some(r => {
                    return state.doc.lineAt(r.from).number !== state.doc.lineAt(r.to).number;
                });
                if (hasMultilineSelection) return indentMore(view);
                view.dispatch(state.replaceSelection('\t'),
                    { scrollIntoView: true, userEvent: 'input' });
                return true;
            },
        },
        { key: 'Shift-Tab', run: indentLess },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
    ]),
];

/**
 * Mount a CodeMirror 6 editor inside `parent`.
 *
 * @param {HTMLElement} parent      - Container element (wm-content div).
 * @param {string}      initialCode - Starting source code.
 * @returns {EditorView}            - CM6 view instance.
 */
export function createCodeEditor(parent, initialCode = '') {
    parent.style.padding    = '0';
    parent.style.overflow   = 'hidden';
    parent.style.background = 'transparent';
    parent.setAttribute('spellcheck', 'false');
    parent.setAttribute('autocorrect', 'off');
    parent.setAttribute('autocapitalize', 'off');

    const view = new EditorView({
        doc: initialCode,
        extensions: [
            setup,
            javascript(),
            oneDark,

            EditorView.theme({
                '&': {
                    height: '100%',
                    fontSize: '14px',
                    fontFamily: editorFont,
                    background: 'rgba(30, 30, 30, 0.9)',
                },
                '.cm-scroller': { overflow: 'auto', background: 'transparent' },
                '.cm-content': {
                    caretColor: '#aeafad',
                    background: 'transparent',
                    fontFamily: editorFont,
                    lineHeight: '1.6',
                },
                '.cm-gutters': {
                    background: 'rgba(25, 25, 25, 0.9)',
                    borderRight: '1px solid rgba(80,80,80,0.4)',
                    fontFamily: editorFont,
                },
                '.cm-activeLineGutter': { background: 'rgba(37,37,37,0.8)', color: '#c6c6c6' },
                '.cm-activeLine':       { background: 'rgba(40, 40, 40, 0.6)' },
                '.cm-selectionBackground': { background: '#264f78 !important' },
                '.cm-cursor': { borderLeftColor: '#aeafad', borderLeftWidth: '2px' },
                '.cm-matchingBracket': {
                    background: 'rgba(0, 100, 0, 0.3)',
                    outline: '1px solid rgba(100, 100, 100, 0.5)',
                },
            }, { dark: true }),

            EditorView.editable.of(true),
            EditorView.contentAttributes.of({
                spellcheck: 'false',
                autocorrect: 'off',
                autocapitalize: 'off',
            }),
        ],
        parent,
    });

    return view;
}
