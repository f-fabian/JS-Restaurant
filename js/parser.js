//parser.js - parses users command input

import { POSITIONS } from './game.js';

export async function executeCode(code, robot, customer, cocktail, addMoney) {
    const lines = code.split("\n").map(line => line.trim()).filter(Boolean);

    for (const line of lines) {

        // moveTo(id)
        const moveToMatch = line.match(/^moveTo\((\d+)\);?$/);
        if (moveToMatch) {
            await robot.moveTo(parseInt(moveToMatch[1]));
            continue;
        }

        // testPosition(id)
        const testPosMatch = line.match(/^testPosition\((\d+)\);?$/);
        if (testPosMatch) {
            const pos = POSITIONS.TABLES_SERVING.find(t => t.id === parseInt(testPosMatch[1]));
            if (pos) cocktail.placeAt(pos.x, pos.y);
            continue;
        }

        // static commands
        switch (line) {
            case "enterAndSit();":           await customer.enterAndSit(); break;
            case "moveToCustomer();":        await robot.moveToCustomer(customer); break;
            case "takeOrder();":             await robot.takeOrder(); break;
            case "drawOrder();":             await customer.drawOrder(cocktail); break;
            case "backToInitialPosition();": await robot.backToInitialPosition(); break;
            case "moveToCocktail();":        await robot.moveToCocktail(cocktail); break;
            case "serve();":                 await robot.serve(cocktail, customer); break;
            case "consumeAndLeave();":       await customer.consumeAndLeave(addMoney); break;
            case "cleanTable();":            await robot.cleanTable(cocktail); break;
        }
    }
}
