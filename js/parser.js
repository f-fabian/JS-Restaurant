//parser.js - parses users command input

export async function executeCode(code, robot, customer,ctx) {
    const lines = code.split("\n").map(line => line.trim());

    const commands = {
        "moveToCustomer();": () => robot.moveToCustomer(customer),
        "takeOrder();": () => robot.takeOrder(),
        "drawOrder();": () => customer.drawOrder(ctx),
        "backToInitialPosition();": () => robot.backToInitialPosition(),
        "moveToCocktail();": () => robot.moveToCocktail({x: 95, y: 100}),
        "serve();": () => robot.serve(),
        "moveTo();": () => robot.moveTo({x: 95, y: 100})

    };

    for (let line of lines) {
        const command = commands[line];
        if (command) await command();
    }
}