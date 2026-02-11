// game.js - game status control

class Game {

    constructor(ctx) {
        this.ctx = ctx;

        // entities creation
        this.robot = new Robot();
        this.customer = new Customer();
    }

    update() {

        // updates robot status
        this.robot.update();
    }

    draw(){

        // clean screen
        this.ctx.clearRect(0, 0, 800, 500);

        // draw entities
        this.robot.draw(this.ctx);
        this.customer.drawCustomer(this.ctx);
    }
}