// Robot.js - Robot class definition.

import { POSITIONS } from './game.js';
import { findPath } from './pathfinding.js';
import { Sprite, directionRow, SPRITE_COLS } from './sprite.js';

const SPRITE_SCALE        = 1.5;
const WALK_TICK_INTERVAL  = 5;   // advance one frame every N RAF ticks (~83 ms at 60 fps)  // rendered frame size = 100 * SPRITE_SCALE px
// Where the character's feet sit inside the 100×100 frame (0 = top, 1 = bottom).
// Tune these two values if the sprite appears offset at any scale.
const SPRITE_ANCHOR_X = 0.5;  // feet are horizontally centred in the frame
const SPRITE_ANCHOR_Y = 0.82; // feet are ~82 % down the frame

const INITIAL_WAYPOINT_ID = 2;

export class Robot {

    constructor() {
        const home = POSITIONS.WAYPOINTS.find(w => w.id === INITIAL_WAYPOINT_ID);
        this.x = home.x;
        this.y = home.y;
        this.size  = 40;
        this.speed = 5;

        // Sprite
        this.sprite      = new Sprite('/assets/character_Sheet.png');
        this.spriteFrame = 3;   // current animation frame (0 = idle/stand)
        this.spriteRow   = 0;   // direction row (0,2,4,6)
        this._walkTick   = 0;   // RAF-tick counter for frame pacing

        // FIFO task queue
        this._queue      = [];
        this._busy       = false;
        this._idleTimer  = null;
        // Optional callback: () => boolean. Return true when there is no pending
        // external work (e.g. dirty tables). Robot only returns home when true.
        this._idleCheck  = null;
    }

    // Set a predicate that must return true before the robot is allowed to go home.
    setIdleCheck(fn) { this._idleCheck = fn; }

    // Add a task function to the queue; returns a Promise that resolves when the task finishes.
    enqueue(task) {
        return new Promise(resolve => {
            this._queue.push(async () => {
                await task();
                resolve();
            });
            this._processQueue();
        });
    }

    async _processQueue() {
        if (this._busy) return;
        this._busy = true;
        while (this._queue.length > 0) {
            const task = this._queue.shift();
            await task();
        }
        this._busy = false;

        // Return to home position after a short idle pause.
        // If a new task arrives before the timer fires it cancels the return.
        clearTimeout(this._idleTimer);
        this._idleTimer = setTimeout(() => {
            const noExternalWork = !this._idleCheck || this._idleCheck();
            if (!this._busy && this._queue.length === 0 && noExternalWork) {
                this.enqueue(() => this.backToInitialPosition());
            }
        }, 600);
    }

    // ── Movement ─────────────────────────────────────────────────────

    // stop=true  → call _stopWalk() on arrival (use for final destination)
    // stop=false → keep the walk frame running (use for intermediate waypoints)
    _moveToPoint(targetX, targetY, stop = true) {
        return new Promise(resolve => {
            const animate = () => {
                const dx   = targetX - this.x;
                const dy   = targetY - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist <= this.speed) {
                    this.x = targetX;
                    this.y = targetY;
                    if (stop) this._stopWalk();
                    resolve();
                    return;
                }

                this.spriteRow = directionRow(dx, dy);

                // Advance walk frame every WALK_TICK_INTERVAL RAF ticks
                this._walkTick++;
                if (this._walkTick >= WALK_TICK_INTERVAL) {
                    this._walkTick   = 0;
                    this.spriteFrame = (this.spriteFrame + 1) % SPRITE_COLS;
                }

                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    }

    _stopWalk() {
        this.spriteFrame = 3;   // idle/stand frame
        this._walkTick   = 0;
    }

    async _followPath(path) {
        for (let i = 0; i < path.length; i++) {
            const isLast = i === path.length - 1;
            await this._moveToPoint(path[i].x, path[i].y, isLast);
        }
    }

    moveTo(tableId) {
        const serviceNodeId = POSITIONS.TABLE_SERVICE[tableId];
        if (serviceNodeId === undefined) return Promise.resolve();
        return this._followPath(findPath(this.x, this.y, serviceNodeId));
    }

    moveToCustomer(customer) {
        if (customer.tableId == null) return Promise.resolve();
        const serviceNodeId = POSITIONS.TABLE_SERVICE[customer.tableId];
        if (serviceNodeId === undefined) return Promise.resolve();
        return this._followPath(findPath(this.x, this.y, serviceNodeId));
    }

    moveToCocktail(cocktail) {
        if (!cocktail || cocktail.waypointId == null) return Promise.resolve();
        return this._followPath(findPath(this.x, this.y, cocktail.waypointId));
    }

    backToInitialPosition() {
        return this._followPath(findPath(this.x, this.y, INITIAL_WAYPOINT_ID));
    }

    // ── Actions ──────────────────────────────────────────────────────

    takeOrder() {
        this.spriteRow = 6;
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    async serve(cocktail, customer) {
        cocktail.pickup();

        const serviceNodeId = POSITIONS.TABLE_SERVICE[customer.tableId];
        if (serviceNodeId !== undefined) {
            await this._followPath(findPath(this.x, this.y, serviceNodeId));
        }

        const servingPos = POSITIONS.TABLES_SERVING.find(t => t.id === customer.tableId);
        if (servingPos) cocktail.placeAt(servingPos.x, servingPos.y);

        this.spriteRow = 6;
        customer.served = true;
    }

    // tableId is passed explicitly so concurrent serves don't overwrite each other
    async cleanTable(cocktail, tableId) {
        const serviceNodeId = POSITIONS.TABLE_SERVICE[tableId];
        if (serviceNodeId !== undefined) {
            await this._followPath(findPath(this.x, this.y, serviceNodeId));
        }
        this.spriteRow = 6;
        await new Promise(r => setTimeout(r, 1500));
        cocktail.pickup();
    }

    draw(ctx) {
        if (this.sprite.loaded) {
            const fw    = this.sprite.frameW * SPRITE_SCALE;
            const fh    = this.sprite.frameH * SPRITE_SCALE;
            // Anchor the sprite so the character's feet stay at the logical position
            // regardless of scale. Tune SPRITE_ANCHOR_X / _Y at the top of this file.
            const feetX = this.x + this.size / 2;
            const feetY = this.y + this.size;
            const drawX = feetX - fw * SPRITE_ANCHOR_X;
            const drawY = feetY - fh * SPRITE_ANCHOR_Y;
            this.sprite.draw(ctx, this.spriteFrame, this.spriteRow, drawX, drawY, SPRITE_SCALE);
        } else {
            ctx.fillStyle = "cyan";
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }
}
