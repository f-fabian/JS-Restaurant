// main.js - game start

import { Robot }    from "./robot.js";
import { Customer } from "./customer.js";
import { Game }     from "./game.js";
import { Cocktail } from "./cocktail.js";

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
const wait        = ms          => new Promise(r => setTimeout(r, ms));
const randBetween = (min, max)  => min + Math.random() * (max - min);

// ── Autonomous customer lifecycle ─────────────────────────────────────
// Each customer loops: wait → enter → sit → robot serves → consume → pay → leave → wait …
async function runCustomer(customer, cocktail, slot, initialDelay) {
    await wait(initialDelay);

    while (true) {
        // Reset and make visible — customer "walks by and decides to enter"
        customer.reset();
        customer.visible = true;
        await customer.enterAndSit();

        const tableId = customer.tableId;

        // Enqueue full service in the robot's FIFO queue.
        // Awaiting the returned promise blocks until the robot finishes this task.
        await robot.enqueue(async () => {
            await robot.moveToCustomer(customer);
            await robot.takeOrder();
            await customer.drawOrder(cocktail, slot);
            await robot.moveToCocktail(cocktail);
            await robot.serve(cocktail, customer);
        });

        // Customer consumes then pays and walks out (robot is free during this time)
        await customer.consumeAndLeave(() => {
            addMoney(5);
            addCustomerCount();
        });

        // Enqueue table cleanup — robot handles it when free
        robot.enqueue(async () => {
            await robot.cleanTable(cocktail, tableId);
        });

        // Random pause before this customer re-enters
        await wait(randBetween(5000, 14000));
    }
}

// Start the simulation on RUN click (only once)
const runBtn = document.getElementById("runBtn");
runBtn.addEventListener("click", () => {
    runBtn.disabled = true;
    runBtn.textContent = "RUNNING";

    // Stagger initial entries so the bar gradually comes to life
    runCustomer(customers[0], cocktails[0], 0, randBetween(3000,  7000));
    runCustomer(customers[1], cocktails[1], 1, randBetween(9000,  15000));
    runCustomer(customers[2], cocktails[2], 2, randBetween(16000, 24000));
}, { once: true });
