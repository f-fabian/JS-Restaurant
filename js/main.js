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

// Controls window — anchored to the bottom-right corner
const WIN_W = 200;
const WIN_H = 80;
const { win: controlsWin, content: controlsContent } = wm.spawn({
    title:  'Controls',
    x:      window.innerWidth  - WIN_W - 20,
    y:      window.innerHeight - WIN_H - 20,
    width:  WIN_W,
    height: WIN_H,
});

// Re-anchor to bottom-right whenever the viewport changes.
window.addEventListener('resize', () => {
    controlsWin.style.left = `${window.innerWidth  - WIN_W - 20}px`;
    controlsWin.style.top  = `${window.innerHeight - WIN_H - 20}px`;
});

const runBtn = document.createElement('button');
runBtn.id          = 'runBtn';
runBtn.textContent = 'RUN';
controlsContent.style.padding = '8px';
controlsContent.appendChild(runBtn);

runBtn.addEventListener('click', () => {
    runBtn.disabled    = true;
    runBtn.textContent = 'RUNNING';

    runCustomer(customers[0], cocktails[0], 0, randBetween(3000,  7000));
    runCustomer(customers[1], cocktails[1], 1, randBetween(9000,  15000));
    runCustomer(customers[2], cocktails[2], 2, randBetween(16000, 24000));
}, { once: true });
