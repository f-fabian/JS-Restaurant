// Robot.js - Robot class definition.

import { POSITIONS } from './game.js';
import { findPath } from './pathfinding.js';

const INITIAL_WAYPOINT_ID = 1;

export class Robot {

    constructor() {
        const home = POSITIONS.WAYPOINTS.find(w => w.id === INITIAL_WAYPOINT_ID);
        this.x = home.x;
        this.y = home.y;
        this.size  = 40;
        this.speed = 6;

        // FIFO task queue
        this._queue = [];
        this._busy  = false;
    }

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
    }

    // ── Movement ─────────────────────────────────────────────────────

    _moveToPoint(targetX, targetY) {
        return new Promise(resolve => {
            const animate = () => {
                const dx   = targetX - this.x;
                const dy   = targetY - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist <= this.speed) {
                    this.x = targetX;
                    this.y = targetY;
                    resolve();
                    return;
                }

                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
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

        customer.served = true;
    }

    // tableId is passed explicitly so concurrent serves don't overwrite each other
    async cleanTable(cocktail, tableId) {
        const serviceNodeId = POSITIONS.TABLE_SERVICE[tableId];
        if (serviceNodeId !== undefined) {
            await this._followPath(findPath(this.x, this.y, serviceNodeId));
        }
        await new Promise(r => setTimeout(r, 1500));
        cocktail.pickup();
    }

    draw(ctx) {
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}
