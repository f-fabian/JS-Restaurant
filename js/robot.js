// Robot.js - Robot class definition.

class Robot {

    constructor(){
        // initial position
        this.x = 100;
        this.y = 250;
        this.size = 40;
        this.speed = 6;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    moveTo(x, y) {
        // destination definition
        this.targetX = x;
        this.targetY = y;
    }

    update() {
        // simple movement to destination
        if (this.x < this.targetX) this.x += this.speed;
        if (this.x > this.targetX) this.x -= this.speed;
        if (this.y < this.targetY) this.y += this.speed;
        if (this.y > this.targetY) this.y -= this.speed;
    }

    draw(ctx) {
        // draw square as a robot
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}