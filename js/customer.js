// customer.js - customer class definition

export class Customer {
    constructor() {
        this.x = 600;
        this.y = 250;
        this.size = 40;
        this.order = "Aperol Spritz";
    }

    draw(ctx) {
        // green square as customer
        ctx.fillStyle = "lime";
        ctx.fillRect(this.x, this.y, this.size, this.size);

        if (this.showOrder) {
            ctx.fillStyle = "white";
            ctx.fillText(this.order, this.x - 10, this.y - 10);
        }
    }

    drawOrder(ctx) {
        this.showOrder = true;
        return new Promise(resolve => {
            setTimeout(() => {
                this.showOrder = false;
                resolve();
            }, 1000);
        });
    }
}