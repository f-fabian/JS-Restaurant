// main.js - game start

// get canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// game create
const game = new Game(ctx);

// main loop
function loop() {
    game.update();
    game.draw();
    requestAnimationFrame(loop);
}

// loop start
loop();

// RUN button
document
.getElementById("runBtn")
.onclick = () => {
    
    // read user's code
    const code = document
    .getElementById("codeInput")
    .value
    
    // code execution (mock)
    eval(code);
}