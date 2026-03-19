// main.js - game start

import { Robot }         from "./robot.js";
import { Customer }      from "./customer.js";
import { Game }          from "./game.js";
import { Cocktail }      from "./cocktail.js";
import { WindowManager } from "./window-manager.js";

// ── Canvas & context ──────────────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// ── Entities ──────────────────────────────────────────────────────────
const robot = new Robot();

const customers = [new Customer(), new Customer(), new Customer()];
const cocktails = [
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
];

// ── Debug dummies (set DEBUG_DUMMIES = false to disable) ─────────────
const DEBUG_DUMMIES = false;
const dummy1 = new Robot();
const dummy2 = new Robot();
dummy1.x = 200; dummy1.y = 450;
dummy2.x = 250; dummy2.y = 480;
// Disable their queue so they just stand still
dummy1._busy = true;
dummy2._busy = true;
window.d1 = dummy1; // move from console: d1.x = 300; d1.y = 400;
window.d2 = dummy2; // move from console: d2.x = 350; d2.y = 430;

const allRobots = DEBUG_DUMMIES ? [robot, dummy1, dummy2] : [robot];
const game = new Game(canvas, allRobots, customers, cocktails, ctx);

robot.setIdleCheck(() => Customer._dirtyTables.size === 0);

// ── Main loop ─────────────────────────────────────────────────────────
function loop() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw();
    requestAnimationFrame(loop);
}
loop();

// ── HUD counters ──────────────────────────────────────────────────────
let money = 0;
const moneyDisplay = document.getElementById("moneyDisplay");
function addMoney(amount) {
    money += amount;
    moneyDisplay.textContent = `$ ${money}`;
}

let servedCount = 0;
const customerDisplay = document.getElementById("customerDisplay");
function addCustomerCount() {
    servedCount++;
    customerDisplay.textContent = `👤 ${servedCount}`;
}

// ── Helpers ───────────────────────────────────────────────────────────
const wait        = ms         => new Promise(r => setTimeout(r, ms));
const randBetween = (min, max) => min + Math.random() * (max - min);

// ── Autonomous customer spawning ──────────────────────────────────────
// Customers enter and sit on their own. The player's code controls the robot.
let _spawningActive = false;

async function spawnCustomerLoop(customer, initialDelay) {
    await wait(initialDelay);

    while (_spawningActive) {
        customer.reset();
        customer.visible = true;
        const seated = await customer.enterAndSit();

        if (!seated) {
            customer.visible = false;
            await wait(randBetween(5000, 9000));
            continue;
        }

        // Wait until this customer leaves before spawning the next one in this slot
        await new Promise(resolve => {
            const check = () => {
                if (!customer.seated && !customer.visible) resolve();
                else setTimeout(check, 500);
            };
            // Customer hasn't been served yet — wait
            check();
        });

        await wait(randBetween(3000, 10000));
    }
}

function startSpawning() {
    if (_spawningActive) return;
    _spawningActive = true;
    spawnCustomerLoop(customers[0], randBetween(1000, 3000));
    spawnCustomerLoop(customers[1], randBetween(4000, 8000));
    spawnCustomerLoop(customers[2], randBetween(8000, 14000));
}

// ── Robot proxy (sandbox for player code) ─────────────────────────────
// Wraps robot methods so they auto-enqueue and use automatic context.
// The player writes `robot.moveToCustomer()` — no params needed.

// Methods available to the player. Filter this array to restrict by level.
const ENABLED_METHODS = [
    'moveToCustomer', 'takeOrder', 'moveToCocktail',
    'serve', 'cleanTable', 'backToInitialPosition', 'moveTo',
];

function buildRobotProxy() {
    // Automatic context — set by moveToCustomer(), used by all others
    let _customer = null;
    let _cocktail = null;
    let _slot     = null;

    // Tracks the last enqueued action's promise so __line can await it
    let _lastAction = Promise.resolve();

    // Find the next seated customer waiting to be served
    function findWaitingCustomer() {
        return customers.find(c => c.visible && c.seated && !c.served);
    }

    // Wait until a customer is seated and waiting
    function waitForCustomer() {
        return new Promise(resolve => {
            const check = () => {
                const c = findWaitingCustomer();
                if (c) resolve(c);
                else setTimeout(check, 300);
            };
            check();
        });
    }

    const methods = {
        async moveToCustomer() {
            _customer = await waitForCustomer();
            _slot     = customers.indexOf(_customer);
            _cocktail = cocktails[_slot];
            await robot.moveToCustomer(_customer);
        },

        async takeOrder() {
            if (!_customer) return;
            await robot.takeOrder();
            await _customer.drawOrder(_cocktail, _slot);
        },

        async moveToCocktail() {
            if (!_cocktail) return;
            await robot.moveToCocktail(_cocktail);
        },

        async serve() {
            if (!_customer || !_cocktail) return;
            await robot.serve(_cocktail, _customer);
            Customer._dirtyTables.add(_customer.tableId);
        },

        async cleanTable() {
            if (!_customer) return;
            const tableId  = _customer.tableId;
            const cocktail = _cocktail;

            // Wait for customer to finish consuming and leave
            await _customer.consumeAndLeave(() => {
                addMoney(5);
                addCustomerCount();
            });

            await robot.cleanTable(cocktail, tableId);
            Customer.markTableCleaned(tableId);

            // Clear context after full cycle
            _customer = null;
            _cocktail = null;
            _slot     = null;
        },

        async backToInitialPosition() {
            await robot.backToInitialPosition();
        },

        async moveTo(tableId) {
            await robot.moveTo(tableId);
        },
    };

    // Build proxy with only enabled methods
    const proxy = {};
    for (const name of ENABLED_METHODS) {
        if (methods[name]) {
            proxy[name] = (...args) => {
                _lastAction = robot.enqueue(() => methods[name](...args));
                return _lastAction;
            };
        }
    }

    // Expose getter so __line can await the last action
    proxy.__awaitLast = () => _lastAction;

    return proxy;
}

// ── Error popup ───────────────────────────────────────────────────────

function friendlyError(err) {
    const msg = err.message || String(err);

    if (err instanceof SyntaxError) {
        if (msg.includes('Unexpected end of input'))
            return "Your code is incomplete. Check that every ( has a ) and every { has a }.";
        if (msg.includes('Unexpected token') || msg.includes('Unexpected identifier'))
            return "Something is wrong with the structure of your code. Check that all ( ) and { } are properly paired.";
        return `Your code has a syntax problem: ${msg}`;
    }

    if (err instanceof ReferenceError) {
        const name = msg.match(/(\w+) is not defined/)?.[1];
        if (name)
            return `"${name}" doesn't exist. Check spelling or make sure it's available.`;
        return `You're using something that hasn't been defined yet.`;
    }

    if (err instanceof TypeError) {
        const fn = msg.match(/(\w+) is not a function/)?.[1];
        if (fn)
            return `"${fn}" is not a function. Did you misspell the method name?`;
        if (msg.includes('Cannot read properties of'))
            return "You're trying to use something that is empty or doesn't exist yet.";
        return `Type problem: ${msg}`;
    }

    return msg;
}

function showErrorPopup(message) {
    // Remove existing popup if any
    const existing = document.getElementById('ide-error-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'ide-error-popup';
    popup.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: #1e1e1e; border: 2px solid #e53935; border-radius: 8px;
        padding: 14px 22px; z-index: 99999; max-width: 520px;
        font-family: "Cascadia Code", "Fira Code", Consolas, monospace;
        font-size: 13px; color: #e0e0e0; box-shadow: 0 4px 24px rgba(0,0,0,0.7);
        display: flex; align-items: flex-start; gap: 10px;
    `;

    const text = document.createElement('span');
    text.innerHTML = `<span style="color:#e53935;font-weight:bold">ERROR</span>: ${message}`;

    const close = document.createElement('button');
    close.textContent = '\u00D7';
    close.style.cssText = `
        background: none; border: none; color: #888; font-size: 20px;
        cursor: pointer; padding: 0 0 0 8px; line-height: 1; flex-shrink: 0;
    `;
    close.onclick = () => popup.remove();

    popup.append(text, close);
    document.body.appendChild(popup);

    // Auto-dismiss after 8 seconds
    setTimeout(() => popup.remove(), 8000);
}

// ── Editor code execution engine ──────────────────────────────────────

// Inject __line(n) calls before each non-empty, non-comment, non-brace-only line.
function instrumentCode(code) {
    return code.split('\n').map((line, i) => {
        const trimmed = line.trim();
        // Skip empty lines, comments, and lines that are only braces/keywords
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')
            || trimmed === '{' || trimmed === '}' || trimmed === '}'
            || trimmed.startsWith('} else') || trimmed.startsWith('else {')
            || trimmed.startsWith('while') || trimmed.startsWith('for')
            || trimmed.startsWith('if') || trimmed.startsWith('else if')) {
            return line;
        }
        // Preserve leading whitespace, prepend __line call
        const indent = line.match(/^(\s*)/)[1];
        return `${indent}await __line(${i + 1}); ${line.trimStart()}`;
    }).join('\n');
}

let _highlightLine = null;
let _clearHighlight = null;

async function executeEditorCode() {
    const code = editor.state.doc.toString();
    if (!code.trim()) return;

    // Lazy-load highlight functions
    if (!_highlightLine) {
        try {
            const mod = await import('./code-editor.js');
            _highlightLine  = mod.highlightLine;
            _clearHighlight = mod.clearHighlight;
        } catch { /* highlight unavailable — run without it */ }
    }

    const robotProxy = buildRobotProxy();

    const sandbox = {
        robot:   robotProxy,
        wait,
        console,
        __line:  async (n) => {
            // Wait for the previous robot action to complete before highlighting next line
            await robotProxy.__awaitLast();
            if (_highlightLine && editor) _highlightLine(editor, n);
        },
    };

    const paramNames    = Object.keys(sandbox);
    const paramValues   = Object.values(sandbox);
    const instrumented  = instrumentCode(code);

    try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction(...paramNames, instrumented);
        await fn(...paramValues);
        // Wait for the last enqueued action to finish before clearing
        await robotProxy.__awaitLast();
    } catch (err) {
        showErrorPopup(friendlyError(err));
    } finally {
        if (_clearHighlight && editor) _clearHighlight(editor);
    }
}

// ── Window Manager ────────────────────────────────────────────────────
const wm = new WindowManager();

// ── Controls window ───────────────────────────────────────────────────
const WIN_W = 320;
const WIN_H = 380;
const { content: controlsContent } = wm.spawn({
    title:  'Controls',
    x:      window.innerWidth  - WIN_W - 20,
    y:      window.innerHeight - WIN_H - 20,
    width:  WIN_W,
    height: WIN_H,
});


// Content = editor (flex:1) + button bar (fixed height)
controlsContent.style.cssText =
    'display:flex; flex-direction:column; padding:0; overflow:hidden; background:transparent;';

// Editor area — fills available space
const editorWrap = document.createElement('div');
editorWrap.style.cssText = 'flex:1; overflow:hidden; min-height:0;';
controlsContent.appendChild(editorWrap);

// Button bar — sits below the editor
const btnBar = document.createElement('div');
btnBar.className = 'wm-controls-bar';
controlsContent.appendChild(btnBar);

const runBtn  = document.createElement('button');
runBtn.id        = 'runBtn';
runBtn.innerHTML = '▶ <span>RUN</span>';

const stepBtn = document.createElement('button');
stepBtn.id        = 'stepBtn';
stepBtn.innerHTML = '⤵ <span>STEP</span>';

btnBar.append(runBtn, stepBtn);

// Mount CodeMirror editor — loaded asynchronously so a CDN failure
// never prevents the canvas / game loop from starting.
const initialCode = `// escribe tu codigo aqui
`;

let editor = null;

import('./code-editor.js')
    .then(({ createCodeEditor }) => {
        editor = createCodeEditor(editorWrap, initialCode);
    })
    .catch(err => {
        console.warn('[editor] failed to load CodeMirror:', err);
        // Fallback: plain textarea so the window stays usable
        const ta = document.createElement('textarea');
        ta.value = initialCode;
        ta.style.cssText =
            'width:100%;height:100%;background:#111;color:#0f0;' +
            'border:none;padding:10px;font-family:monospace;font-size:13px;resize:none;outline:none;';
        editorWrap.appendChild(ta);
        editor = { state: { doc: { toString: () => ta.value } } };
    });

runBtn.addEventListener('click', () => {
    runBtn.disabled  = true;
    runBtn.innerHTML = '▶ <span>RUNNING</span>';
    stepBtn.disabled = true;

    // Start autonomous customer spawning
    startSpawning();

    // Execute whatever the player wrote in the editor
    executeEditorCode()
        .then(() => {
            runBtn.disabled  = false;
            runBtn.innerHTML = '▶ <span>RUN</span>';
            stepBtn.disabled = false;
        })
        .catch(err => {
            console.error('[IDE]', err);
            runBtn.disabled  = false;
            runBtn.innerHTML = '▶ <span>RUN</span>';
            stepBtn.disabled = false;
        });
});

// STEP — line-by-line execution (wired up in a future task)
stepBtn.addEventListener('click', () => {
    const code = editor.state.doc.toString();
    console.log('[STEP] code in editor:', code);
});