// game.js - game status control

export class Game {
    constructor(robots, customers, cocktails, ctx) {
        this.robots = robots;
        this.customers = customers;
        this.cocktails = cocktails;
        this.ctx = ctx;
    }

    draw() {
        this.customers.forEach(c => c.draw(this.ctx));
        this.robots.forEach(r => r.draw(this.ctx));
        this.cocktails.forEach(c => c.draw(this.ctx, 95, 100));
    }
}