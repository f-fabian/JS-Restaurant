// ui.js 

import { executeCode } from "./parser";

const codeInput = document.getElementById("codeInput");
const runButton = document.getElementById("runBtn");

runButton.addEventListener("click", async () => {
    const code = codeInput.value;
    await executeCode(code, robot, customer);
});
