// ui.js - functions called by RUN button

function moveToCustomer() {
    
    // moves robot to customer
    game.robot.moveTo(
        game.customer.x - 50,
        game.customer.y
    )
};

function takeOrder() {
    if (game.robot.x === game.customer.x - 50) {
        game.customer.drawOrder(ctx);
    }
};

function serve() {
    // serving simulation
    console.log("Order Served...");
}