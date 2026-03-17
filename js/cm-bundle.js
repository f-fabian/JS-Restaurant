// cm-bundle.js — CodeMirror 6 entry point for esbuild.
// Run: npx esbuild js/cm-bundle.js --bundle --format=esm --outfile=js/cm.bundle.min.js --minify
//
// This file is NOT loaded by the browser directly. esbuild compiles it
// into js/cm.bundle.min.js which is a single self-contained ESM file.

// ── Core ──
export { EditorView, keymap, lineNumbers, highlightActiveLineGutter,
         highlightSpecialChars, drawSelection, dropCursor,
         rectangularSelection, crosshairCursor, highlightActiveLine
       } from '@codemirror/view';

export { EditorState } from '@codemirror/state';

// ── Language support ──
export { syntaxHighlighting, defaultHighlightStyle, indentOnInput,
         bracketMatching, foldGutter, foldKeymap
       } from '@codemirror/language';

export { javascript } from '@codemirror/lang-javascript';

// ── Editing ──
export { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
export { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap
       } from '@codemirror/autocomplete';

// ── Search & lint ──
export { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
export { lintKeymap } from '@codemirror/lint';

// ── Theme ──
export { oneDark } from '@codemirror/theme-one-dark';
