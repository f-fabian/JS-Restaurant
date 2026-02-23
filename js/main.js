// main.js - game start

import { Robot } from "./robot.js";
import { Customer } from "./customer.js";
import { Game } from "./game.js"; 
import { executeCode } from "./parser.js";
import { Cocktail } from "./cocktail.js";

// get canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// create entities
const customer = new Customer(600, 200);
const robot = new Robot(100, 200);
const cocktail = new Cocktail("Aperol Spritz", "/assets/aperol.png");
const game = new Game ([robot], [customer], [cocktail], ctx);
robot.holdingImage = cocktail;

// main loop
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw();
    requestAnimationFrame(loop);
}

// loop start
loop();

// RUN button

const codeInput = document.getElementById("codeInput");
const runBtn = document.getElementById("runBtn");

runBtn.addEventListener("click", async () => {
    const code = codeInput.value;
    await executeCode(code, robot, customer, ctx);
})