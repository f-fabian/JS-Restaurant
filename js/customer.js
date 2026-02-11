// customer.js - customer class definition

class Customer {
    constructor() {
        this.x = 600;
        this.y = 250;
        this.size = 40;
        this.order = "Aperol Spritz";
    }

    drawCustomer(ctx) {
        // green square as customer
        ctx.fillStyle = "lime";
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    drawOrder(ctx){
        // order text
        ctx.fillStyle = "white";
        ctx.fillText(this.order, this.x - 10, this.y - 10);
    }
}