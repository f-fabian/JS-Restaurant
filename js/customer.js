// customer.js - customer class definition

import { POSITIONS } from './game.js';
import { findPath } from './pathfinding.js';

const SPAWN_X          = 760;
const SPAWN_Y          = 210;
const DOOR_X           = 950;
const DOOR_Y           = 320;
const ENTRY_WAYPOINT   = 20;   // waypoint where the customer enters the corridor network
const SPEED            = 4;

export class Customer {
    constructor() {
        this.size  = 40;
        this.order = "Aperol Spritz";
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
    }

    // ── Movement helpers ────────────────────────────────────────────

    _moveToPoint(targetX, targetY) {
        return new Promise(resolve => {
            const animate = () => {
                const dx   = targetX - this.x;
                const dy   = targetY - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist <= SPEED) {
                    this.x = targetX;
                    this.y = targetY;
                    resolve();
                    return;
                }

                this.x += (dx / dist) * SPEED;
                this.y += (dy / dist) * SPEED;
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    }

    async _followPath(path) {
        for (const wp of path) {
            await this._moveToPoint(wp.x, wp.y);
        }
    }

    // ── Entry sequence ───────────────────────────────────────────────

    // Pick a random free table
    _pickTable() {
        const idx = Math.floor(Math.random() * POSITIONS.TABLES_SEATS.length);
        return POSITIONS.TABLES_SEATS[idx];
    }

    async enterAndSit() {
        this.served = false;

        // 1. Walk from spawn to door (straight line, outside corridors)
        await this._moveToPoint(DOOR_X, DOOR_Y);

        // 2. Walk directly to entry waypoint — no nearest-waypoint search,
        //    which is what caused the erratic movement before.
        const entryWp = POSITIONS.WAYPOINTS.find(w => w.id === ENTRY_WAYPOINT);
        await this._moveToPoint(entryWp.x, entryWp.y);

        // 3. Choose a table and navigate through corridors via Dijkstra
        const table = this._pickTable();
        this.tableId = table.id;
        const serviceNodeId = POSITIONS.TABLE_SERVICE[table.id];
        await this._followPath(findPath(entryWp.x, entryWp.y, serviceNodeId));

        // 4. Move from corridor to the table itself (sit down)
        await this._moveToPoint(table.x, table.y);
        this.seated = true;
    }

    // ── Leave sequence ───────────────────────────────────────────────

    async consumeAndLeave(onPayment) {
        // 1. Consume for 4 seconds
        await new Promise(r => setTimeout(r, 4000));

        // 2. Pay — trigger floating dollar animation
        onPayment(5);
        this.paymentAnim = { y: this.y - 10, alpha: 1.0 };

        // 3. Navigate through corridors back to entry waypoint
        await this._followPath(findPath(this.x, this.y, ENTRY_WAYPOINT));

        // 4. Walk out through the door and back to spawn, then disappear
        await this._moveToPoint(DOOR_X, DOOR_Y);
        await this._moveToPoint(SPAWN_X, SPAWN_Y);

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

        // Body color: orange while waiting to be served, lime otherwise
        ctx.fillStyle = (this.seated && !this.served) ? "orange" : "lime";
        ctx.fillRect(this.x, this.y, this.size, this.size);

        // Speech bubble when order is shown
        if (this.showOrder) {
            const text    = this.order;
            const padding = 8;
            ctx.font = "bold 13px monospace";
            const tw  = ctx.measureText(text).width;
            const bw  = tw + padding * 2;
            const bh  = 26;
            const bx  = this.x + this.size / 2 - bw / 2;
            const by  = this.y - bh - 14;
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
            ctx.moveTo(this.x + this.size / 2 - 6, by + bh);
            ctx.lineTo(this.x + this.size / 2,      by + bh + 10);
            ctx.lineTo(this.x + this.size / 2 + 6,  by + bh);
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
            ctx.strokeText("$5", this.x + 8, a.y);
            ctx.fillText("$5",   this.x + 8, a.y);
            ctx.restore();

            a.y     -= 1.5;
            a.alpha -= 0.015;
            if (a.alpha <= 0) this.paymentAnim = null;
        }
    }
}
