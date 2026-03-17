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

// 3 customer/cocktail pairs — each pair owns a fixed bar slot (0/1/2)
const customers = [new Customer(), new Customer(), new Customer()];
const cocktails = [
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
];

const game = new Game(canvas, [robot], customers, cocktails, ctx);

// Robot only returns home when no table is waiting to be cleaned.
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

// ── Autonomous customer lifecycle ─────────────────────────────────────
async function runCustomer(customer, cocktail, slot, initialDelay) {
    await wait(initialDelay);

    while (true) {
        customer.reset();
        customer.visible = true;
        const seated = await customer.enterAndSit();

        if (!seated) {
            customer.visible = false;
            await wait(randBetween(5000, 9000));
            continue;
        }

        const tableId = customer.tableId;

        await robot.enqueue(async () => {
            await robot.moveToCustomer(customer);
            await robot.takeOrder();
            await customer.drawOrder(cocktail, slot);
            await robot.moveToCocktail(cocktail);
            await robot.serve(cocktail, customer);
            Customer._dirtyTables.add(customer.tableId);
        });

        await customer.consumeAndLeave(() => {
            addMoney(5);
            addCustomerCount();
        });

        robot.enqueue(async () => {
            await robot.cleanTable(cocktail, tableId);
            Customer.markTableCleaned(tableId);
        });

        await wait(randBetween(5000, 14000));
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
const initialCode =
`while (customers) {
    moveToCustomer();
    takeOrder();
    moveToCocktail();
    serve();
    backToInitialPosition();
    cleanTable();
}`;

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

    runCustomer(customers[0], cocktails[0], 0, randBetween(3000,  7000));
    runCustomer(customers[1], cocktails[1], 1, randBetween(9000,  15000));
    runCustomer(customers[2], cocktails[2], 2, randBetween(16000, 24000));
}, { once: true });

// STEP — line-by-line execution (wired up in a future task)
stepBtn.addEventListener('click', () => {
    const code = editor.state.doc.toString();
    console.log('[STEP] code in editor:', code);
});
