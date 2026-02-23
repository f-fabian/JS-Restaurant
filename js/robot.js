// Robot.js - Robot class definition.

export class Robot {

    constructor(){
        // initial position
        this.x = 100;
        this.y = 250;
        this.size = 40;
        this.speed = 6;
        this.served = true;
    }

    backToInitialPosition() {
        return new Promise(resolve => {
            const dx = 55 - this.x;
            const dy = 250 - this.y;
            const distance = Math.hypot(dx, dy);
            const steps = Math.ceil(distance / this.speed);
            const stepX = dx / steps;
            const stepY = dy / steps;

            let currentStep = 0;
            const animate = () => {
                if (currentStep < steps - 8) {
                    this.x += stepX;
                    this.y += stepY;
                    currentStep++;
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    moveToCustomer(customer) {
        return new Promise(resolve => {
            const dx = customer.x - this.x;
            const dy = customer.y - this.y;
            console.log(dx, dy);
            const distance = Math.hypot(dx, dy);
            const steps = Math.ceil(distance / this.speed);
            const stepX = dx / steps;
            const stepY = dy / steps;

            let currentStep = 0;
            const animate = () => {
                if (currentStep < steps - 8) {
                    this.x += stepX;
                    this.y += stepY;
                    currentStep++;
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    moveToCocktail(cocktail) {
        return new Promise(resolve => {
            const dx = cocktail.x - this.x;
            const dy = cocktail.y - this.y;
            const distance = Math.hypot(dx, dy);
            const steps = Math.ceil(distance / this.speed);
            const stepX = dx / steps;
            const stepY = dy / steps;

            let currentStep = 0;
            const animate = () => {
                if (currentStep < steps - 8) {
                    this.x += stepX;
                    this.y += stepY;
                    currentStep++;
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    serve() {
        this.served = false;
        return new Promise(resolve => {
            setTimeout(() => {
                this.served = true;
                resolve();
            }, 1000);
        });
    }


    takeOrder(ctx) {
        return new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    }

    draw(ctx) {
        // draw square as a robot
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.x, this.y, this.size, this.size);

        if (!this.served) {
            ctx.fillStyle = "yellow";
            ctx.fillText("¡Orden servida!", this.x, this.y - 10);
        }
    }
}