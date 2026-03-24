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

// Pool of reusable customer instances (enough to fill the window queue)
const customers = Array.from({ length: 9 }, () => new Customer());
const cocktails = [
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
    new Cocktail("Aperol Spritz", "/assets/aperol.png"),
];
const coffee = new Cocktail("Coffee", "/assets/aperol.png", 1); // TODO: replace with coffee sprite

// ── Debug flags ──────────────────────────────────────────────────────
const DEBUG_DUMMIES    = false;
const DEBUG_SHOW_BTNS  = false;  // true = Updates & Hints buttons visible from start
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

// ── Spawn first customer (triggered after welcome screen) ──
let _firstCustomerSpawned = false;
function spawnFirstCustomer() {
    setTimeout(async () => {
        const first = customers.find(c => !c.visible);
        if (first) {
            first.reset();
            await first.enterWindowQueue();
        }
        _firstCustomerSpawned = true;
    }, 500);
}

// ── Welcome screen ──────────────────────────────────────────────────
function showWelcomeScreen() {
    const font = '"Cascadia Code", "Fira Code", Consolas, monospace';

    // Blocking overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 200000; background: rgba(0,0,0,0.65);
        display: flex; align-items: center; justify-content: center;
    `;

    // Main card
    const card = document.createElement('div');
    card.style.cssText = `
        background: #1a1a2e; border: 2px solid #4fc3f7; border-radius: 12px;
        padding: 0; width: min(420px, 90vw); max-height: 90vh;
        font-family: ${font}; color: #e0e0e0;
        box-shadow: 0 8px 48px rgba(0,0,0,0.8);
        display: flex; flex-direction: column; align-items: center;
        overflow: hidden;
        opacity: 0; transform: scale(0.95);
        transition: opacity 0.5s ease, transform 0.5s ease;
    `;

    // Header image area (uses the background as banner)
    const banner = document.createElement('div');
    banner.style.cssText = `
        width: 100%; height: 160px;
        background: url('./assets/background.png') center 30% / cover;
        border-bottom: 2px solid #333;
        position: relative;
    `;
    // Dark gradient overlay on banner for readability
    const bannerOverlay = document.createElement('div');
    bannerOverlay.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(transparent 40%, #1a1a2e 100%);
    `;
    banner.appendChild(bannerOverlay);
    card.appendChild(banner);

    // Content area
    const body = document.createElement('div');
    body.style.cssText = `
        padding: 24px 32px 28px; width: 100%;
        display: flex; flex-direction: column; align-items: center; gap: 16px;
    `;

    // Title
    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 28px; font-weight: bold; color: #4fc3f7;
        letter-spacing: 2px; text-transform: uppercase; text-align: center;
        margin-top: -8px;
    `;
    title.textContent = 'Burachok JS Bar';
    body.appendChild(title);

    // Subtitle / tagline
    const tagline = document.createElement('div');
    tagline.style.cssText = `
        font-size: 13px; color: #999; text-align: center;
        line-height: 1.6; max-width: 320px;
    `;
    tagline.textContent = 'Write code. Serve coffee. Build your empire.';
    body.appendChild(tagline);

    // Separator
    const sep = document.createElement('div');
    sep.style.cssText = 'width: 60px; height: 2px; background: #333; margin: 4px 0;';
    body.appendChild(sep);

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
        display: flex; flex-direction: column; gap: 10px;
        width: 100%; max-width: 260px;
    `;

    function makeBtn(label, color, primary = false) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            background: ${primary ? color : 'transparent'};
            color: ${primary ? '#1a1a2e' : color};
            border: 2px solid ${color};
            border-radius: 8px; padding: 12px 0; cursor: pointer;
            font-family: ${font}; font-size: ${primary ? '15px' : '13px'};
            font-weight: bold; letter-spacing: 1px;
            text-transform: uppercase; text-align: center;
            transition: background 0.2s ease, color 0.2s ease;
            width: 100%;
        `;
        btn.addEventListener('mouseenter', () => {
            if (primary) {
                btn.style.background = '#1a1a2e';
                btn.style.color = color;
            } else {
                btn.style.background = color;
                btn.style.color = '#1a1a2e';
            }
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = primary ? color : 'transparent';
            btn.style.color = primary ? '#1a1a2e' : color;
        });
        return btn;
    }

    const startBtn   = makeBtn('New Game', '#4fc3f7', true);
    const optionsBtn = makeBtn('Options', '#888');
    const exitBtn    = makeBtn('Exit', '#888');

    btnContainer.append(startBtn);
    body.appendChild(btnContainer);

    // Version
    const version = document.createElement('div');
    version.style.cssText = 'font-size: 10px; color: #555; margin-top: 4px;';
    version.textContent = 'v0.1 — Early Access';
    body.appendChild(version);

    card.appendChild(body);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Fade in
    requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
    });

    // Start game
    startBtn.addEventListener('click', () => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            showTutorial();
        }, 500);
    });

    // Placeholder buttons
    optionsBtn.addEventListener('click', () => {
        // TODO: options menu
    });
    exitBtn.addEventListener('click', () => {
        // TODO: exit action
    });
}

showWelcomeScreen();

// ── Tutorial ─────────────────────────────────────────────────────────
function showTutorial() {
    const font = '"Cascadia Code", "Fira Code", Consolas, monospace';
    const accent = '#4fc3f7';

    const pages = [
        {
            title: 'Welcome, Developer',
            body: `You've just been hired to run <span style="color:${accent}">Burachok JS Bar</span> — a small coffee shop on a busy street.\n\nThere's just one catch: your only employee is a <span style="color:${accent}">robot</span>, and it doesn't do anything on its own.`,
        },
        {
            title: 'Your Job',
            body: `You need to <span style="color:${accent}">write code</span> to tell the robot what to do.\n\nServe coffee to customers, earn money, and unlock new abilities to grow your business.`,
        },
        {
            title: 'The IDE',
            body: `This is where you'll write code to control the robot. The <span style="color:${accent}">RUN</span> button executes your commands.\n\n<span style="color:#fff">Click the</span> <span style="color:#a78bfa">IDE</span> <span style="color:#fff">button below to continue.</span>`,
            _handler: null,
            onEnter() {
                const self = this;
                // Hide Next instantly until user opens the IDE
                nextBtn.style.transition = 'none';
                nextBtn.style.opacity = '0';
                nextBtn.style.pointerEvents = 'none';
                // Re-enable transition for the fade-in when IDE is opened
                requestAnimationFrame(() => {
                    nextBtn.style.transition = 'opacity 0.4s ease';
                });

                // After a short reading delay, show arrow first, then fade in IDE button
                setTimeout(() => {
                    // Add bounce keyframes
                    if (!document.getElementById('ideArrowBounceStyle')) {
                        const style = document.createElement('style');
                        style.id = 'ideArrowBounceStyle';
                        style.textContent = `@keyframes ideArrowBounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }`;
                        document.head.appendChild(style);
                    }

                    // Arrow appears first
                    const arrow = document.createElement('div');
                    arrow.textContent = '▼';
                    arrow.style.cssText = `
                        position: fixed; z-index: 200002;
                        font-size: 28px; color: #a78bfa;
                        pointer-events: none;
                        opacity: 0; transition: opacity 1s ease;
                        animation: ideArrowBounce 1s ease-in-out infinite;
                    `;
                    // Position arrow centered above IDE button
                    const rect = ideBtn.getBoundingClientRect();
                    arrow.style.left = (rect.left + rect.width / 2) + 'px';
                    arrow.style.top = (rect.top - 36) + 'px';
                    arrow.style.transform = 'translateX(-50%)';  // center regardless of char width
                    document.body.appendChild(arrow);
                    requestAnimationFrame(() => { arrow.style.opacity = '1'; });
                    self._arrow = arrow;

                    // 1 second later, fade in IDE button, then pulse after fade
                    setTimeout(() => {
                        ideBtn.style.opacity = '1';
                        ideBtn.style.pointerEvents = 'auto';
                        ideBtn.style.zIndex = '200001';

                        // Start pulsing AFTER the fade-in completes (2.5s)
                        const pulseIn = () => {
                            ideBtn.style.transition = 'background 0.5s ease-in-out, color 0.5s ease-in-out';
                            ideBtn.style.background = ideColor;
                            ideBtn.style.color = '#1e1e1e';
                        };
                        const pulseOut = () => {
                            ideBtn.style.transition = 'background 0.6s ease-in-out, color 0.6s ease-in-out';
                            ideBtn.style.background = '#1e1e1e';
                            ideBtn.style.color = ideColor;
                        };
                        self._pulseRunning = true;
                        const doPulse = () => {
                            if (!self._pulseRunning) return;
                            pulseIn();
                            setTimeout(() => {
                                if (!self._pulseRunning) return;
                                pulseOut();
                                setTimeout(doPulse, 500);
                            }, 500);
                        };
                        // Wait for fade to finish before starting pulse
                        setTimeout(doPulse, 500);

                        // When user clicks IDE button, stop pulse, remove arrow, reveal Next
                        self._handler = () => {
                            self._pulseRunning = false;
                            ideBtn.style.transition = 'background 0.2s ease, color 0.2s ease';
                            controlsWin.style.zIndex = '200001';
                            if (self._arrow) {
                                self._arrow.style.opacity = '0';
                                setTimeout(() => { self._arrow.remove(); self._arrow = null; }, 400);
                            }
                            nextBtn.style.opacity = '1';
                            nextBtn.style.pointerEvents = 'auto';
                        };
                        ideBtn.addEventListener('click', self._handler);
                    }, 700);
                }, 1500);
            },
            onLeave() {
                this._pulseRunning = false;
                ideBtn.style.transition = 'background 0.2s ease, color 0.2s ease';
                ideBtn.style.zIndex = '100000';
                controlsWin.style.zIndex = '';
                // Close IDE if open
                if (_ideOpen) ideBtn.click();
                if (this._handler) {
                    ideBtn.removeEventListener('click', this._handler);
                    this._handler = null;
                }
                // Remove arrow if still present
                if (this._arrow) { this._arrow.remove(); this._arrow = null; }
                // Restore Next button for other pages
                nextBtn.style.opacity = '1';
                nextBtn.style.pointerEvents = 'auto';
            },
        },
        {
            title: 'Hints',
            body: `Throughout the game you'll receive <span style="color:#ffb74d">hints</span> and tips. They are saved automatically so you can revisit them anytime.\n\nClick the <span style="color:#ffb74d">Hints</span> button to browse your collected advice. It will flash each time a new hint is added.`,
            onEnter() {
                setTimeout(() => {
                    // Build button if needed (with its built-in fade)
                    if (!_hintsBtn) _buildHintsButton();
                    _hintsBtn.style.zIndex = '200001';

                    // Pulse 3 times
                    let count = 0;
                    const pulseIn = () => {
                        _hintsBtn.style.transition = 'background 0.5s ease-in-out, color 0.5s ease-in-out';
                        _hintsBtn.style.background = '#ffb74d';
                        _hintsBtn.style.color = '#1e1e1e';
                    };
                    const pulseOut = () => {
                        _hintsBtn.style.transition = 'background 0.6s ease-in-out, color 0.6s ease-in-out';
                        _hintsBtn.style.background = '#1e1e1e';
                        _hintsBtn.style.color = '#ffb74d';
                    };
                    const doPulse = () => {
                        if (count >= 3) {
                            pulseOut();
                            setTimeout(() => {
                                _hintsBtn.style.transition = 'background 0.2s ease, color 0.2s ease';
                            }, 600);
                            return;
                        }
                        pulseIn();
                        setTimeout(() => {
                            pulseOut();
                            count++;
                            setTimeout(doPulse, 500);
                        }, 500);
                    };
                    doPulse();
                }, 1500);
            },
            onLeave() {
                if (_hintsBtn) _hintsBtn.style.zIndex = '100000';
            },
        },
        {
            title: 'Let\'s Start',
            body: `A customer is about to arrive. Open the <span style="color:#a78bfa">IDE</span>, write your first line of code, and serve them a coffee.\n\n<span style="color:#999">Hint: try writing</span> <span style="color:${accent}">robot.serveCoffee()</span>`,
        },
    ];

    let currentPage = 0;

    // Overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 200000; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
    `;

    // Card
    const card = document.createElement('div');
    card.style.cssText = `
        background: #1a1a2e; border: 2px solid ${accent}; border-radius: 12px;
        width: min(440px, 90vw); min-height: 260px;
        font-family: ${font}; color: #e0e0e0;
        box-shadow: 0 8px 48px rgba(0,0,0,0.8);
        display: flex; flex-direction: column;
        opacity: 0; transform: scale(0.95);
        transition: opacity 0.4s ease, transform 0.4s ease;
    `;

    // Title area
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
        padding: 20px 24px 12px; font-size: 20px; font-weight: bold;
        color: ${accent}; letter-spacing: 1px;
        border-bottom: 1px solid #333;
    `;

    // Body area
    const bodyEl = document.createElement('div');
    bodyEl.style.cssText = `
        padding: 20px 24px; flex: 1;
        font-size: 14px; line-height: 1.8; color: #ccc;
        white-space: pre-wrap;
    `;

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 12px 24px 16px;
        display: flex; justify-content: space-between; align-items: center;
    `;

    // Page indicator
    const pageIndicator = document.createElement('div');
    pageIndicator.style.cssText = `font-size: 12px; color: #555;`;

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.style.cssText = `
        background: ${accent}; color: #1a1a2e;
        border: 2px solid ${accent}; border-radius: 8px;
        padding: 8px 24px; cursor: pointer;
        font-family: ${font}; font-size: 13px; font-weight: bold;
        letter-spacing: 1px; text-transform: uppercase;
        transition: background 0.2s ease, color 0.2s ease;
    `;
    nextBtn.addEventListener('mouseenter', () => {
        nextBtn.style.background = '#1a1a2e';
        nextBtn.style.color = accent;
    });
    nextBtn.addEventListener('mouseleave', () => {
        nextBtn.style.background = accent;
        nextBtn.style.color = '#1a1a2e';
    });

    footer.append(pageIndicator, nextBtn);
    card.append(titleEl, bodyEl, footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let _prevPage = -1;
    function renderPage() {
        // Call onLeave on previous page
        if (_prevPage >= 0 && pages[_prevPage].onLeave) pages[_prevPage].onLeave();

        const page = pages[currentPage];
        titleEl.textContent = page.title;
        bodyEl.innerHTML = page.body;
        pageIndicator.textContent = `${currentPage + 1} / ${pages.length}`;

        const isLast = currentPage === pages.length - 1;
        nextBtn.textContent = isLast ? 'Start' : 'Next';

        // Call onEnter on current page
        if (page.onEnter) page.onEnter();
        _prevPage = currentPage;
    }

    nextBtn.addEventListener('click', () => {
        if (currentPage < pages.length - 1) {
            currentPage++;
            renderPage();
        } else {
            // Call onLeave on last page
            if (pages[currentPage].onLeave) pages[currentPage].onLeave();
            // Close tutorial
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            overlay.style.transition = 'opacity 0.4s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                // Open the IDE
                if (!_ideOpen) ideBtn.click();
                // Spawn first customer
                spawnFirstCustomer();
            }, 400);
        }
    });

    renderPage();

    // Fade in
    requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
    });
}

// ── HUD counters ──────────────────────────────────────────────────────
let money = 5;
const moneyDisplay = document.getElementById("moneyDisplay");
function addMoney(amount) {
    money += amount;
    moneyDisplay.textContent = `$ ${money}`;
}

let servedCount = 6;
const customerDisplay = document.getElementById("customerDisplay");
const beansDisplay    = document.getElementById("beansDisplay");

function updateBeansDisplay() {
    beansDisplay.textContent = `☕ ${robot.beans}`;
}
function addCustomerCount() {
    servedCount++;
    customerDisplay.textContent = `👤 ${servedCount}`;
    if (servedCount === 7 && buildFirmwarePanel.reveal) {
        showHintPopup();
    }
}

// ── Helpers ───────────────────────────────────────────────────────────
const wait        = ms         => new Promise(r => setTimeout(r, ms));
const randBetween = (min, max) => min + Math.random() * (max - min);

// ── Unlock system ────────────────────────────────────────────────────
// Tracks which language features and robot methods the player can use.
const unlocked = {
    methods:  new Set(['serveCoffee']),
    sensors:  new Set(),              // machineReady, etc.
    loops:    false,   // while, for
    conds:    false,   // if, else
};

// Validate code against unlocked features. Returns error message or null.
function validateCode(code) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (!t || t.startsWith('//') || t.startsWith('/*') || t === '{' || t === '}') continue;

        // Check for locked loops
        if (!unlocked.loops && /^\s*(while|for)\s*\(/.test(lines[i]))
            return `Line ${i + 1}: "while" loops are not unlocked yet. Purchase "Marketing" to unlock them.`;

        // Check for locked conditionals
        if (!unlocked.conds && /^\s*(if|else)\s*[\({]/.test(lines[i]))
            return `Line ${i + 1}: Conditionals (if/else) are not unlocked yet. They can be purchased in the shop.`;

        // Check for locked robot methods
        const methodCall = t.match(/^robot\.(\w+)\s*\(/);
        if (methodCall && !unlocked.methods.has(methodCall[1]))
            return `Line ${i + 1}: "robot.${methodCall[1]}()" is not unlocked yet. It can be purchased in the shop.`;

        // Check for locked sensor functions
        const sensorCall = lines[i].match(/machineReady\s*\(/);
        if (sensorCall && !unlocked.sensors.has('machineReady'))
            return `Line ${i + 1}: "machineReady()" is not unlocked yet. Purchase "Stock Check" to unlock it.`;
    }
    return null;
}

// ── Autonomous customer spawning ──────────────────────────────────────
// Customers enter on their own. The player's code controls the robot.
let _spawningActive = false;
let _gameMode = 'window'; // 'window' (level 1) or 'table' (later levels)

// ── Table mode spawning (used in later levels) ──
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

        await new Promise(resolve => {
            const check = () => {
                if (!customer.seated && !customer.visible) resolve();
                else setTimeout(check, 500);
            };
            check();
        });

        await wait(randBetween(3000, 10000));
    }
}

// ── Window mode spawning (level 1) ──
// Single sequential loop — spawns one customer at a time from the pool.
let _marketingUnlocked = false;

async function windowSpawnLoop() {
    // Wait for the initial auto-spawned customer before spawning more
    if (!_marketingUnlocked) {
        // If first customer hasn't spawned yet, wait for it
        if (!_firstCustomerSpawned) {
            await new Promise(resolve => {
                const check = () => {
                    if (_firstCustomerSpawned) resolve();
                    else setTimeout(check, 100);
                };
                check();
            });
        }
        const existing = customers.find(c => c.visible);
        if (existing) {
            await new Promise(resolve => {
                const check = () => {
                    if (!existing.visible) resolve();
                    else setTimeout(check, 500);
                };
                check();
            });
            await wait(randBetween(500, 1000));
        }
    }

    while (_spawningActive) {
        // Find a free customer instance from the pool
        const free = customers.find(c => !c.visible);
        if (!free || Customer._windowQueue.length >= 9) {
            await wait(500);
            continue;
        }

        free.reset();
        const entered = await free.enterWindowQueue();
        if (!entered) {
            await wait(1000);
            continue;
        }

        if (!_marketingUnlocked) {
            // Pre-marketing: wait until this customer leaves, then spawn next
            await new Promise(resolve => {
                const check = () => {
                    if (!free.visible) resolve();
                    else setTimeout(check, 500);
                };
                check();
            });
            await wait(randBetween(500, 1000));
        } else {
            // Post-marketing: short delay, then spawn next (fills the queue)
            await wait(randBetween(1500, 3000));
        }
    }
}

function startSpawning() {
    if (_spawningActive) return;
    _spawningActive = true;

    if (_gameMode === 'window') {
        windowSpawnLoop();
    } else {
        spawnCustomerLoop(customers[0], randBetween(1000, 3000));
        spawnCustomerLoop(customers[1], randBetween(4000, 8000));
        spawnCustomerLoop(customers[2], randBetween(8000, 14000));
    }
}

// ── Robot proxy (sandbox for player code) ─────────────────────────────
// Wraps robot methods so they auto-enqueue and use automatic context.
// The player writes `robot.moveToCustomer()` — no params needed.

// Methods available to the player. Filter this array to restrict by level.
const ENABLED_METHODS = [
    'moveToCustomer', 'takeOrder', 'moveToCocktail',
    'serve', 'cleanTable', 'backToInitialPosition', 'moveTo',
    'serveCoffee', 'refill',
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

        async serveCoffee() {
            // Wait for a customer at the front of the window queue
            const frontCustomer = await new Promise(resolve => {
                const check = () => {
                    const queue = Customer._windowQueue;
                    if (queue.length > 0 && queue[0].seated && !queue[0].served) {
                        resolve(queue[0]);
                    } else {
                        setTimeout(check, 300);
                    }
                };
                check();
            });

            // Small delay before robot starts preparing
            await new Promise(r => setTimeout(r, 1000));

            // Bean logic only applies after Stock Check is purchased
            if (unlocked.conds) {
                if (robot.beans > 0) {
                    robot.beans--;
                    updateBeansDisplay();

                    await robot.serveCoffee(3000);

                    await frontCustomer.leaveWindowQueue(() => {
                        addMoney(coffee.price);
                        addCustomerCount();
                    }, coffee.price);
                } else {
                    // No beans — customer leaves angry
                    await frontCustomer.leaveWindowQueueAngry(() => {
                        addMoney(-1);
                    }, 1);
                }
            } else {
                // Pre-upgrade: unlimited beans
                await robot.serveCoffee(3000);

                await frontCustomer.leaveWindowQueue(() => {
                    addMoney(coffee.price);
                    addCustomerCount();
                }, coffee.price);
            }
        },

        async refill() {
            await robot.refill(2000);
            updateBeansDisplay();
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

// ── Hints system ─────────────────────────────────────────────────────
const _hints = [];       // { title, body }
let _hintsList = null;   // DOM: left sidebar list
let _hintsBody = null;   // DOM: right content viewer
let _hintsWin  = null;   // the wm window element
let _hintsBtn  = null;   // fixed button (like Updates)
let _selectedHint = -1;
const _font = '"Cascadia Code", "Fira Code", Consolas, monospace';

// ── Fixed "Hints" button (same style as Updates, positioned below it) ──
function _buildHintsButton() {
    const btn = document.createElement('button');
    btn.textContent = 'Hints';
    btn.style.cssText = `
        position: fixed; top: 12px; left: 12px; z-index: 100000;
        background: #1e1e1e; color: #ffb74d; border: 2px solid #ffb74d;
        border-radius: 8px; padding: 12px 0; cursor: pointer; width: 148px;
        font-family: ${_font}; font-size: 16px; font-weight: bold;
        letter-spacing: 1px; text-transform: uppercase; text-align: center;
        opacity: 0; pointer-events: none;
        transition: opacity 2s ease, background 0.2s ease, color 0.2s ease;
    `;
    let _hintsOpen = false;
    btn.addEventListener('mouseenter', () => {
        if (_hintsOpen) return;
        btn.style.background = '#ffb74d';
        btn.style.color = '#1e1e1e';
    });
    btn.addEventListener('mouseleave', () => {
        if (_hintsOpen) return;
        btn.style.background = '#1e1e1e';
        btn.style.color = '#ffb74d';
    });
    document.body.appendChild(btn);
    _hintsBtn = btn;

    // Fade in
    requestAnimationFrame(() => {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    });

    btn.addEventListener('click', () => {
        if (!_hintsWin) _buildHintsWindow();
        const isHidden = _hintsWin.style.display === 'none';
        _hintsWin.style.display = isHidden ? '' : 'none';
        _hintsOpen = isHidden;
        if (isHidden) {
            btn.style.background = '#ffb74d';
            btn.style.color = '#1e1e1e';
            _renderHintsList();
            // Show the selected hint's content
            if (_hints.length > 0) {
                if (_selectedHint < 0) _selectedHint = 0;
                _hintsBody.innerHTML = _hints[_selectedHint].body;
            }
        } else {
            btn.style.background = '#1e1e1e';
            btn.style.color = '#ffb74d';
        }
    });
}

// ── Hints window (split panel: sidebar + viewer) ──
function _buildHintsWindow() {
    const HINTS_W = 460;
    const HINTS_H = 300;
    const { win, content } = wm.spawn({
        title:  'Hints',
        x:      60,
        y:      Math.round(window.innerHeight / 2 - HINTS_H / 2),
        width:  HINTS_W,
        height: HINTS_H,
    });
    _hintsWin = win;
    // Start hidden
    win.style.display = 'none';

    // Override close button — just hide, no taskbar pill
    // Override close button — delegate to the Hints toggle button
    const wmCloseBtn = win.querySelector('.wm-btn-close');
    const newClose = wmCloseBtn.cloneNode(true);  // clone removes old listeners
    wmCloseBtn.parentNode.replaceChild(newClose, wmCloseBtn);
    newClose.addEventListener('click', () => {
        if (_hintsBtn) _hintsBtn.click();  // reuse toggle logic
    });

    content.style.cssText =
        'display:flex; flex-direction:row; padding:0; overflow:hidden; background:#1e1e1e;';

    // Left sidebar — hint titles
    const sidebar = document.createElement('div');
    sidebar.style.cssText = `
        width: 140px; min-width: 100px; flex-shrink: 0;
        background: #252526; border-right: 1px solid #333;
        overflow-y: auto; padding: 4px 0;
    `;
    _hintsList = sidebar;

    // Right panel — hint body
    const viewer = document.createElement('div');
    viewer.style.cssText = `
        flex: 1; padding: 16px 20px; overflow-y: auto;
        font-family: ${_font}; font-size: 13px; line-height: 1.7; color: #d4d4d4;
        user-select: text; white-space: pre-wrap;
    `;
    _hintsBody = viewer;

    content.append(sidebar, viewer);
}

function _renderHintsList() {
    if (!_hintsList) return;
    _hintsList.innerHTML = '';
    _hints.forEach((h, i) => {
        const item = document.createElement('div');
        item.textContent = h.title;
        item.style.cssText = `
            padding: 6px 12px; cursor: pointer; font-size: 12px;
            font-family: ${_font};
            color: ${i === _selectedHint ? '#fff' : '#aaa'};
            background: ${i === _selectedHint ? '#094771' : 'transparent'};
            border-left: 2px solid ${i === _selectedHint ? '#4fc3f7' : 'transparent'};
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        `;
        item.addEventListener('click', () => {
            _selectedHint = i;
            _renderHintsList();
            _hintsBody.innerHTML = h.body;
        });
        _hintsList.appendChild(item);
    });
}

// ── Floating hint toast (individual, dismissable) ──
function _showHintToast(title, body, onClose, topPx = 63) {
    // Blocking overlay — prevents interaction with anything else
    const blocker = document.createElement('div');
    blocker.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 100000; background: rgba(0,0,0,0.3);
    `;
    document.body.appendChild(blocker);

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: ${topPx}px; left: 12px; z-index: 100001;
        background: #1a1a2e; border: 2px solid #ffb74d; border-radius: 8px;
        padding: 16px 20px; max-width: 380px; min-width: 280px;
        font-family: ${_font}; font-size: 14px; line-height: 1.6; color: #e0e0e0;
        box-shadow: 0 4px 24px rgba(0,0,0,0.7);
        opacity: 0; transition: opacity 0.5s ease;
    `;

    // Close button (top-right, red circle with white X)
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u00D7';
    closeBtn.style.cssText = `
        position: absolute; top: 8px; right: 8px;
        width: 22px; height: 22px; border: none; border-radius: 50%;
        background: #e05050; color: #fff; font-size: 14px; line-height: 1;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-family: monospace; font-weight: bold; transition: opacity 0.15s;
    `;
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '0.8'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '1'; });
    closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        blocker.style.opacity = '0';
        blocker.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            toast.remove();
            blocker.remove();
            if (onClose) onClose();
        }, 500);
    });

    const content = document.createElement('div');
    content.style.cssText = 'padding-right: 20px;';
    content.innerHTML = `<div style="color:#ffb74d;font-weight:bold;margin-bottom:8px;font-size:13px">${title}</div>${body}`;

    toast.append(closeBtn, content);
    document.body.appendChild(toast);

    requestAnimationFrame(() => { toast.style.opacity = '1'; });
}

// ── Flash the Hints button to signal a new hint was archived ──
const FLASH_IN   = 0.25;  // seconds — fade in (smooth ramp up)
const FLASH_HOLD = 15;   // ms — how long it stays lit
const FLASH_OUT  = 0.25;   // seconds — fade out
function _flashHintsButton() {
    if (!_hintsBtn) return;
    _hintsBtn.style.transition = `background ${FLASH_IN}s ease-in, color ${FLASH_IN}s ease-in`;
    _hintsBtn.style.background = '#ffb74d';
    _hintsBtn.style.color = '#1e1e1e';
    setTimeout(() => {
        _hintsBtn.style.transition = `background ${FLASH_OUT}s ease-out, color ${FLASH_OUT}s ease-out`;
        _hintsBtn.style.background = '#1e1e1e';
        _hintsBtn.style.color = '#ffb74d';
        setTimeout(() => {
            _hintsBtn.style.transition = 'opacity 2s ease, background 0.2s ease, color 0.2s ease';
        }, FLASH_OUT * 1000);
    }, FLASH_IN * 1000 + FLASH_HOLD);
}
// window.flash = _flashHintsButton;  // DEBUG — call flash() in console to test

// ── Public: add a hint (shows toast, archives on dismiss) ──
function addHint(title, body, onClose) {
    // Show floating toast — on close, archive into the hints window
    _showHintToast(title, body, () => {
        _hints.push({ title, body });
        _selectedHint = _hints.length - 1;
        if (_hintsWin) _renderHintsList();
        if (_hintsBtn) _flashHintsButton();
        if (onClose) onClose();
    });
}

function showHintPopup() {
    const hintTitle = 'Updates available';
    const hintBody  = `Serving customers one by one is slow... There must be a better way.\n\n`
        + `<span style="color:#4fc3f7">Check for available updates.</span>`;

    // 1) Show the hint toast (below Updates button at top:62px)
    _showHintToast(hintTitle, hintBody, () => {
        // Archive this hint
        _hints.push({ title: hintTitle, body: hintBody });
        _selectedHint = _hints.length - 1;

        // 2) Show a second toast explaining the Hints button (NOT archived)
        _showHintToast(
            'Hints saved',
            `All hints are saved for you. Click the <span style="color:#ffb74d;font-weight:bold">Hints</span> button to read them again anytime. It will flash each time a new hint is saved.`,
            () => {
                // flash once the tutorial toast is dismissed too
                if (_hintsBtn) _flashHintsButton();
            },
            63  // below the Hints button (now at top: 12px)
        );

        // 3) After a delay, show the Hints button
        setTimeout(() => {
            if (!_hintsBtn) _buildHintsButton();
        }, 2000);
    }, 113);  // below the Updates button (now at top: 62px)

    // Show the Updates button after 2s
    setTimeout(() => {
        if (buildFirmwarePanel.reveal) buildFirmwarePanel.reveal();
    }, 2000);
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

    // Validate against unlocked features
    const lockError = validateCode(code);
    if (lockError) {
        showErrorPopup(lockError);
        return;
    }

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
        machineReady: () => robot.beans > 0,
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
const { win: controlsWin, content: controlsContent } = wm.spawn({
    title:  'Robot Controls',
    x:      window.innerWidth  - WIN_W - 20,
    y:      window.innerHeight - WIN_H - 20,
    width:  WIN_W,
    height: WIN_H,
});

// ── IDE pill button (fixed position, styled like Updates/Hints) ──
const ideColor = '#a78bfa';  // soft purple
let _ideOpen = false;
const ideBtn = document.createElement('button');
ideBtn.textContent = 'IDE';
ideBtn.style.cssText = `
    position: fixed; bottom: 10px; left: 12px; z-index: 100000;
    background: #1e1e1e; color: ${ideColor}; border: 2px solid ${ideColor};
    border-radius: 8px; padding: 12px 0; cursor: pointer; width: 148px;
    font-family: "Cascadia Code", "Fira Code", Consolas, monospace;
    font-size: 16px; font-weight: bold;
    letter-spacing: 1px; text-transform: uppercase; text-align: center;
    opacity: 0; pointer-events: none;
    transition: opacity 1s ease, background 0.2s ease, color 0.2s ease;
`;
ideBtn.addEventListener('mouseenter', () => {
    if (_ideOpen) return;
    ideBtn.style.background = ideColor;
    ideBtn.style.color = '#1e1e1e';
});
ideBtn.addEventListener('mouseleave', () => {
    if (_ideOpen) return;
    ideBtn.style.background = '#1e1e1e';
    ideBtn.style.color = ideColor;
});
ideBtn.addEventListener('click', () => {
    _ideOpen = !_ideOpen;
    controlsWin.style.display = _ideOpen ? '' : 'none';
    if (_ideOpen) {
        ideBtn.style.background = ideColor;
        ideBtn.style.color = '#1e1e1e';
    } else {
        ideBtn.style.background = '#1e1e1e';
        ideBtn.style.color = ideColor;
    }
});
document.body.appendChild(ideBtn);

// Override close button — use IDE toggle instead of taskbar pill
const ideCloseBtn = controlsWin.querySelector('.wm-btn-close');
const ideCloseNew = ideCloseBtn.cloneNode(true);
ideCloseBtn.parentNode.replaceChild(ideCloseNew, ideCloseBtn);
ideCloseNew.addEventListener('click', () => { ideBtn.click(); });

// Start with IDE closed
controlsWin.style.display = 'none';
ideBtn.style.background = '#1e1e1e';
ideBtn.style.color = ideColor;

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
const initialCode = `// Write your code here. 
// Use the "RUN" button to execute. 

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
    // Start autonomous customer spawning
    startSpawning();

    // Execute whatever the player wrote in the editor
    executeEditorCode()
        .catch(err => {
            console.error('[IDE]', err);
        });
});

// STEP — line-by-line execution (wired up in a future task)
stepBtn.addEventListener('click', () => {
    const code = editor.state.doc.toString();
    console.log('[STEP] code in editor:', code);
});

// ── Firmware Updates (shop) ───────────────────────────────────────────

const firmwareUpgrades = [
    {
        id: 'marketing',
        name: 'Marketing Module',
        version: 'v1.1',
        desc: 'Attract more customers to your window.',
        cost: 5,
        purchased: false,
        onBuy() {
            unlocked.loops = true;
            _marketingUnlocked = true;
            startSpawning();
        },
    },
    {
        id: 'stockcheck',
        name: 'Stock Check',
        version: 'v1.2',
        desc: 'Check bean stock before serving. Unlocks if/else, machineReady() and robot.refill().',
        cost: 5,
        purchased: false,
        requires: 'marketing',
        onBuy() {
            unlocked.conds = true;
            unlocked.methods.add('refill');
            unlocked.sensors.add('machineReady');
            robot.beans = 15;
            beansDisplay.style.display = '';
            updateBeansDisplay();
        },
    },
];

function buildFirmwarePanel() {
    const font = '"Cascadia Code", "Fira Code", Consolas, monospace';

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Updates';
    toggleBtn.style.cssText = `
        position: fixed; top: 62px; left: 12px; z-index: 100000;
        background: #1e1e1e; color: #4fc3f7; border: 2px solid #4fc3f7;
        border-radius: 8px; padding: 12px 0; cursor: pointer; width: 148px;
        font-family: ${font}; font-size: 16px; font-weight: bold;
        letter-spacing: 1px; text-transform: uppercase; text-align: center;
        opacity: 0; pointer-events: none;
        transition: opacity 2s ease, background 0.2s ease, color 0.2s ease;
    `;
    let _updatesOpen = false;
    toggleBtn.addEventListener('mouseenter', () => {
        if (_updatesOpen) return;
        toggleBtn.style.background = '#4fc3f7';
        toggleBtn.style.color = '#1e1e1e';
    });
    toggleBtn.addEventListener('mouseleave', () => {
        if (_updatesOpen) return;
        toggleBtn.style.background = '#1e1e1e';
        toggleBtn.style.color = '#4fc3f7';
    });
    document.body.appendChild(toggleBtn);

    // Expose reveal so addCustomerCount can trigger it
    buildFirmwarePanel.reveal = () => {
        toggleBtn.style.opacity = '1';
        toggleBtn.style.pointerEvents = 'auto';
    };

    if (DEBUG_SHOW_BTNS) buildFirmwarePanel.reveal();

    // Overlay (click outside to close)
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 99998; display: none;
    `;
    document.body.appendChild(overlay);

    // Panel (centered)
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        z-index: 99999;
        background: #1a1a2e; border: 2px solid #4fc3f7; border-radius: 8px;
        padding: 16px; width: 280px; display: none;
        font-family: ${font}; font-size: 12px; color: #e0e0e0;
        box-shadow: 0 4px 24px rgba(0,0,0,0.7);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #333;';
    header.innerHTML = '<span style="color:#4fc3f7;font-weight:bold;font-size:14px">FIRMWARE UPDATES</span>';

    const panelCloseBtn = document.createElement('button');
    panelCloseBtn.textContent = '\u00D7';
    panelCloseBtn.style.cssText = `
        width: 22px; height: 22px; border: none; border-radius: 50%;
        background: #e05050; color: #fff; font-size: 14px; line-height: 1;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-family: monospace; font-weight: bold; flex-shrink: 0;
    `;
    panelCloseBtn.addEventListener('mouseenter', () => { panelCloseBtn.style.opacity = '0.8'; });
    panelCloseBtn.addEventListener('mouseleave', () => { panelCloseBtn.style.opacity = '1'; });
    header.appendChild(panelCloseBtn);

    panel.appendChild(header);

    // Items container
    const list = document.createElement('div');
    list.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    panel.appendChild(list);

    function renderItems() {
        list.innerHTML = '';
        for (const up of firmwareUpgrades) {
            const reqMet = !up.requires || firmwareUpgrades.find(u => u.id === up.requires)?.purchased;

            const item = document.createElement('div');
            item.style.cssText = `
                background: #16213e; border: 1px solid ${up.purchased ? '#555' : reqMet ? '#4fc3f7' : '#333'};
                border-radius: 6px; padding: 10px;
                opacity: ${!reqMet && !up.purchased ? '0.5' : '1'};
            `;

            const top = document.createElement('div');
            top.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';
            top.innerHTML = `
                <span style="color:${up.purchased ? '#555' : '#4fc3f7'}; font-weight:bold; font-size:12px">
                    ${up.name} <span style="color:#888; font-weight:normal">${up.version}</span>
                </span>
            `;

            const desc = document.createElement('div');
            desc.style.cssText = 'color: #999; font-size: 11px; margin-bottom: 8px;';
            desc.textContent = up.desc;

            item.appendChild(top);
            item.appendChild(desc);

            if (up.purchased) {
                const badge = document.createElement('div');
                badge.style.cssText = 'color: #66bb6a; font-size: 11px; font-weight: bold;';
                badge.textContent = 'INSTALLED';
                item.appendChild(badge);
            } else if (!reqMet) {
                const lock = document.createElement('div');
                const reqName = firmwareUpgrades.find(u => u.id === up.requires)?.name || up.requires;
                lock.style.cssText = 'color: #888; font-size: 11px;';
                lock.textContent = `Requires: ${reqName}`;
                item.appendChild(lock);
            } else {
                const btn = document.createElement('button');
                btn.textContent = `Install — $${up.cost}`;
                btn.style.cssText = `
                    background: transparent; color: #4fc3f7; border: 1px solid #4fc3f7;
                    border-radius: 4px; padding: 4px 10px; cursor: pointer;
                    font-family: ${font}; font-size: 11px; font-weight: bold;
                    width: 100%;
                `;
                btn.addEventListener('mouseenter', () => { btn.style.background = '#4fc3f722'; });
                btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
                btn.addEventListener('click', () => {
                    if (money < up.cost) {
                        showErrorPopup(`Not enough money. You need $${up.cost} to install ${up.name}.`);
                        return;
                    }
                    addMoney(-up.cost);
                    up.purchased = true;
                    up.onBuy();
                    renderItems();
                });
                item.appendChild(btn);
            }

            list.appendChild(item);
        }
    }

    renderItems();
    document.body.appendChild(panel);

    function openPanel() {
        panel.style.display = 'block';
        overlay.style.display = 'block';
        _updatesOpen = true;
        toggleBtn.style.background = '#4fc3f7';
        toggleBtn.style.color = '#1e1e1e';
        renderItems();
    }

    function closePanel() {
        panel.style.display = 'none';
        overlay.style.display = 'none';
        _updatesOpen = false;
        toggleBtn.style.background = '#1e1e1e';
        toggleBtn.style.color = '#4fc3f7';
    }

    // Toggle
    toggleBtn.addEventListener('click', () => {
        if (_updatesOpen) closePanel();
        else openPanel();
    });

    // Click outside or close button to close
    overlay.addEventListener('click', closePanel);
    panelCloseBtn.addEventListener('click', closePanel);
}

buildFirmwarePanel();
if (DEBUG_SHOW_BTNS) _buildHintsButton();