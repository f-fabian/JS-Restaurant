// customer.js - customer class definition

import { POSITIONS } from './game.js';
import { findPath } from './pathfinding.js';
import { Sprite, directionRow, SPRITE_COLS } from './sprite.js';

const SPRITE_SCALE        = 1.5;
const WALK_TICK_INTERVAL  = 5;   // advance one frame every N RAF ticks (~83 ms at 60 fps)  // rendered frame size = 100 * SPRITE_SCALE px
const SPRITE_ANCHOR_X = 0.5;  // feet are horizontally centred in the frame
const SPRITE_ANCHOR_Y = 0.82; // feet are ~82 % down the frame

const SPAWN_X          = 760;
const SPAWN_Y          = 210;
const DOOR_X           = 950;
const DOOR_Y           = 320;
const ENTRY_WAYPOINT   = 20;   // waypoint where the customer enters the corridor network
const SPEED            = 3;

// Window queue (level 1) — customers walk from spawn through this path
const WINDOW_SPAWN_WP  = 29;
const WINDOW_QUEUE_PATH = [30, 31, 32, 33, 34, 35, 36, 37, 38]; // back → front (serving point)

export class Customer {
    // Shared across all instances — tracks which table IDs are currently occupied.
    static _occupiedTables = new Set();
    // Tables that have been used but not yet cleaned by the robot.
    static _dirtyTables    = new Set();
    // Window queue — ordered front (index 0 = at serving point 38) to back
    static _windowQueue    = [];

    // Called by main.js after robot.cleanTable() finishes.
    static markTableCleaned(tableId) {
        Customer._dirtyTables.delete(tableId);
    }
    
    constructor() {
        this.size  = 40;
        this.order = "Aperol Spritz";

        // Sprite
        this.sprite      = new Sprite('/assets/character_clothed.png');
        this.spriteFrame = 3;   // current animation frame (0 = idle/stand)
        this.spriteRow   = 0;   // direction row (0,2,4,6)
        this._walkTick   = 0;   // RAF-tick counter for frame pacing

        this.reset();
    }

    // Resets state for a fresh entry cycle. Call before each new visit.
    reset() {
        this.x           = SPAWN_X;
        this.y           = SPAWN_Y;
        this.tableId     = null;
        this.showOrder   = false;
        this.seated      = false;
        this.served      = false;
        this.visible     = false;   // hidden until the cycle explicitly shows the customer
        this.paymentAnim = null;
        this.mode        = 'table'; // 'table' (default) or 'window'
    }

    // ── Movement helpers ────────────────────────────────────────────

    _moveToPoint(targetX, targetY, stop = true) {
        return new Promise(resolve => {
            const animate = () => {
                const dx   = targetX - this.x;
                const dy   = targetY - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist <= SPEED) {
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

                this.x += (dx / dist) * SPEED;
                this.y += (dy / dist) * SPEED;
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

    // ── Entry sequence ───────────────────────────────────────────────

    // Pick a random table that is neither occupied nor waiting to be cleaned.
    _pickTable() {
        const free = POSITIONS.TABLES_SEATS.filter(
            t => !Customer._occupiedTables.has(t.id) &&
                 !Customer._dirtyTables.has(t.id)
        );
        if (free.length === 0) return null;
        return free[Math.floor(Math.random() * free.length)];
    }

    // Returns true when seated, false if no table was available (caller should retry).
    async enterAndSit() {
        // Claim a free table immediately — before walking — so two customers
        // arriving at the same time never race for the same seat.
        const table = this._pickTable();
        if (!table) return false;

        this.tableId = table.id;
        Customer._occupiedTables.add(table.id);
        this.served = false;

        // 1. Walk from spawn to door (straight line, outside corridors)
        await this._moveToPoint(DOOR_X, DOOR_Y);

        // 2. Walk directly to entry waypoint
        const entryWp = POSITIONS.WAYPOINTS.find(w => w.id === ENTRY_WAYPOINT);
        await this._moveToPoint(entryWp.x, entryWp.y);

        // 3. Navigate through corridors via Dijkstra
        const serviceNodeId = POSITIONS.TABLE_SERVICE[table.id];
        await this._followPath(findPath(entryWp.x, entryWp.y, serviceNodeId));

        // 4. Move from corridor to the table itself (sit down)
        await this._moveToPoint(table.x, table.y);
        this.seated = true;
        if (this.seated && this.tableId % 2 == 0) {
            this.spriteRow = 4; // sanity check
        } else {
            this.spriteRow = 0; // sanity check
        }
        return true;
    }

    // ── Window queue (level 1) ─────────────────────────────────────

    // Returns the waypoint coords for a given queue index (0 = front at wp 38)
    static _windowWaypoint(queueIndex) {
        const wpId = WINDOW_QUEUE_PATH[WINDOW_QUEUE_PATH.length - 1 - queueIndex];
        return POSITIONS.WAYPOINTS.find(w => w.id === wpId);
    }

    // Shift all customers in the window queue forward by one position
    static advanceWindowQueue() {
        Customer._windowQueue.forEach((c, i) => {
            const target = Customer._windowWaypoint(i);
            c._moveToPoint(target.x, target.y).then(() => {
                if (i === 0) c.spriteRow = 6; // front of queue faces the window
            });
        });
    }

    // Spawn outside and walk through the queue path to the back of the line.
    // Returns false if the queue is full.
    async enterWindowQueue() {
        if (Customer._windowQueue.length >= WINDOW_QUEUE_PATH.length) return false;

        this.mode    = 'window';
        this.visible = true;

        // Spawn at window spawn waypoint
        const spawn = POSITIONS.WAYPOINTS.find(w => w.id === WINDOW_SPAWN_WP);
        this.x = spawn.x;
        this.y = spawn.y;

        // My position in the queue (0 = front)
        const myIndex = Customer._windowQueue.length;
        Customer._windowQueue.push(this);

        // Walk from spawn through each waypoint up to my assigned spot
        const targetPathIndex = WINDOW_QUEUE_PATH.length - 1 - myIndex;
        for (let i = 0; i <= targetPathIndex; i++) {
            const wp = POSITIONS.WAYPOINTS.find(w => w.id === WINDOW_QUEUE_PATH[i]);
            await this._moveToPoint(wp.x, wp.y, i === targetPathIndex);
            if (wp.id === 38) {
                this.spriteRow = 6; // facing right at the window
            }
        }

        this.seated = true; // "in position" — reused for robot detection
        return true;
    }

    // ── Leave sequences ──────────────────────────────────────────────

    // Window mode: customer is served, pays, walks to exit, disappears.
    async leaveWindowQueue(onPayment, price = 1) {
        // Remove from front of queue
        Customer._windowQueue.shift();

        // Pay — floating dollar animation
        this.served = true;
        onPayment(price);
        const spriteTop = (this.y + this.size) - this.sprite.frameH * SPRITE_SCALE * SPRITE_ANCHOR_Y;
        this.paymentAnim = { y: spriteTop - 10, alpha: 1.0, amount: price };

        // Walk to exit waypoints
        const wp39 = POSITIONS.WAYPOINTS.find(w => w.id === 39);
        const wp40 = POSITIONS.WAYPOINTS.find(w => w.id === 40);
        await this._moveToPoint(wp39.x, wp39.y, false);
        await this._moveToPoint(wp40.x, wp40.y);

        this.visible     = false;
        this.seated      = false;
        this.served      = false;
        this.paymentAnim = null;

        // Advance remaining customers in the queue
        Customer.advanceWindowQueue();
    }

    // Table mode: customer consumes, pays, walks out through corridors.
    async consumeAndLeave(onPayment, price = 5) {
        // 1. Consume for 4 seconds
        await new Promise(r => setTimeout(r, 4000));

        // 2. Pay — trigger floating dollar animation (start above the sprite head)
        onPayment(price);
        const spriteTop = (this.y + this.size) - this.sprite.frameH * SPRITE_SCALE * SPRITE_ANCHOR_Y;
        this.paymentAnim = { y: spriteTop - 10, alpha: 1.0, amount: price };

        // 3. Navigate through corridors back to entry waypoint
        await this._followPath(findPath(this.x, this.y, ENTRY_WAYPOINT));

        // 4. Walk out through the door and back to spawn, then disappear
        await this._moveToPoint(DOOR_X, DOOR_Y);
        await this._moveToPoint(SPAWN_X, SPAWN_Y);

        Customer._occupiedTables.delete(this.tableId);
        Customer._dirtyTables.add(this.tableId);   // blocked until robot cleans it
        this.visible      = false;
        this.seated       = false;
        this.served       = false;
        this.tableId      = null;
        this.paymentAnim  = null;
    }

    // ── Actions (called by robot interactions) ───────────────────────

    // slot (0/1/2): which bar counter to use. Undefined = random.
    drawOrder(cocktail, slot) {
        const counterIds = POSITIONS.COUNTER_SERVICE;
        const idx        = slot !== undefined
            ? slot % counterIds.length
            : Math.floor(Math.random() * counterIds.length);
        const id              = counterIds[idx];
        const displayWaypoint = POSITIONS.WAYPOINTS.find(w => w.id === id);
        const pickupId        = POSITIONS.COUNTER_PICKUP[id];
        cocktail.place(displayWaypoint, pickupId);

        this.showOrder = true;
        return new Promise(resolve => {
            setTimeout(() => {
                this.showOrder = false;
                resolve();
            }, 1000);
        });
    }

    // ── Render ───────────────────────────────────────────────────────

    draw(ctx) {
        if (!this.visible) return;

        // Compute sprite draw position anchored so the character's feet stay
        // at the logical position regardless of scale. Tune SPRITE_ANCHOR_* above.
        const fw    = this.sprite.loaded ? this.sprite.frameW * SPRITE_SCALE : this.size;
        const fh    = this.sprite.loaded ? this.sprite.frameH * SPRITE_SCALE : this.size;
        const feetX = this.x + this.size / 2;
        const feetY = this.y + this.size;
        const drawX = feetX - fw * SPRITE_ANCHOR_X;
        const drawY = feetY - fh * SPRITE_ANCHOR_Y;

        if (this.sprite.loaded) {
            this.sprite.draw(ctx, this.spriteFrame, this.spriteRow, drawX, drawY, SPRITE_SCALE);
        } else {
            // Fallback while image loads
            ctx.fillStyle = (this.seated && !this.served) ? "orange" : "lime";
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }

        // Speech bubble when order is shown
        if (this.showOrder) {
            const text    = this.order;
            const padding = 8;
            ctx.font = "bold 13px monospace";
            const tw  = ctx.measureText(text).width;
            const bw  = tw + padding * 2;
            const bh  = 26;
            const bx  = feetX - bw / 2;
            const by  = drawY - bh - 8;
            const r   = 5;

            // Bubble background
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, r);
            ctx.fill();

            // Bubble stroke
            ctx.strokeStyle = "#aaa";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Tail (small triangle pointing down)
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(feetX - 6, by + bh);
            ctx.lineTo(feetX,     by + bh + 10);
            ctx.lineTo(feetX + 6, by + bh);
            ctx.fill();

            // Text
            ctx.fillStyle = "#111";
            ctx.fillText(text, bx + padding, by + bh - 7);
        }

        // Floating dollar sign payment animation
        if (this.paymentAnim) {
            const a = this.paymentAnim;
            ctx.save();
            ctx.globalAlpha = a.alpha;
            ctx.font        = "bold 24px monospace";
            ctx.fillStyle   = "#ffd700";
            ctx.strokeStyle = "#000";
            ctx.lineWidth   = 3;
            const label = `$${a.amount || 5}`;
            ctx.strokeText(label, feetX - 10, a.y);
            ctx.fillText(label,   feetX - 10, a.y);
            ctx.restore();

            a.y     -= 1.5;
            a.alpha -= 0.015;
            if (a.alpha <= 0) this.paymentAnim = null;
        }
    }
}
