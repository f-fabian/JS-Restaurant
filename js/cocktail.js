// cocktail.js

export class Cocktail {
    constructor(name, imageSrc) {
        this.name      = name;
        this.image     = new Image();
        this.image.src = imageSrc;

        this.x          = 0;
        this.y          = 0;
        this.waypointId = null;
        this.ready      = false;   // invisible until drawOrder() is called
    }

    // Called by customer.drawOrder()
    // displayWaypoint  → visual position on the bar (nodes 22/23/24)
    // pickupWaypointId → where the robot navigates to pick it up (nodes 25/26/27)
    place(displayWaypoint, pickupWaypointId) {
        this.x          = displayWaypoint.x;
        this.y          = displayWaypoint.y;
        this.waypointId = pickupWaypointId;
        this.ready      = true;
    }

    // Robot picks it up — disappears from bar
    pickup() {
        this.ready      = false;
        this.waypointId = null;
    }

    // Robot delivers it — reappears on the table
    placeAt(x, y) {
        this.x     = x;
        this.y     = y;
        this.ready = true;
    }

    draw(ctx) {
        if (!this.ready) return;
        ctx.drawImage(this.image, this.x, this.y, 50, 50);
    }
}
