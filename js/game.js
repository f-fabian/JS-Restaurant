// game.js - game status control

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
export const POSITIONS = {
    COUNTERS: [
        {id: 1, x: 370, y: 235},
        {id: 2, x: 400, y: 220},
        {id: 3, x: 445, y: 200}
    ],
    
    TABLES_SEATS: [
        {id: 1, x: 420, y: 440}, {id: 2, x: 560, y: 510},
        {id: 3, x: 570, y: 360}, {id: 4, x: 710, y: 440},
        {id: 5, x: 720, y: 290}, {id: 6, x: 860, y: 370},
        {id: 7, x: 630, y: 540}, {id: 8, x: 780, y: 620},
        {id: 9, x: 780, y: 470}, {id: 10, x: 920, y: 540},
        {id: 11, x: 930, y: 400}, {id: 12, x: 1070, y: 470}
    ],

    TABLES_SERVING: [
        {id: 1, x: 465, y: 440}, {id: 2, x: 515, y: 460},
        {id: 3, x: 610, y: 370}, {id: 4, x: 665, y: 390},
        {id: 5, x: 760, y: 290}, {id: 6, x: 815, y: 315},
        {id: 7, x: 670, y: 540}, {id: 8, x: 730, y: 565},
        {id: 9, x: 820, y: 470}, {id: 10, x: 875, y: 490},
        {id: 11, x: 965, y: 395}, {id: 12, x: 1025, y: 420}
    ],

    //
    // Corridor waypoints — robot ONLY walks through these nodes.
    //
    //   ID map (adjust x,y to match your background):
    //
    //    [BAR]
    //   25 26 27
    //      |
    //   2──3──────4──────5      ← upper corridor
    //   |  |      |      |
    //   6  10    14     18      ← top of each lateral corridor
    //   7  11    15     19
    //   8  12    16     20      ← bottom of each lateral corridor
    //   9  13    17     21
    //
    //   0 (home) → 1 (entry) → 2
    //
    WAYPOINTS: [
        // Home / entry
        {id: 1,  x: 310, y: 390},   // entry

        // Upper corridor (left→right) – also tops of lateral corridors
        {id: 2,  x: 300, y: 440},   // UC left  = top of LC1
        {id: 3,  x: 450, y: 370},   // UC–LC2 junction
        {id: 4,  x: 600, y: 300},   // UC–LC3 junction
        {id: 5,  x: 700, y: 230},   // UC–LC4 junction

        // service nodes for tables (also midpoints of lateral corridors)
        
        // LC1 – left corridor (nodes 2, 6, 7, 8, 9)
        {id: 6,  x: 380, y: 490},   // LC1 top
        {id: 7,  x: 500, y: 550},   // LC1 upper-mid
        {id: 8,  x: 585, y: 590},   // LC1 lower-mid
        {id: 9,  x: 720, y: 655},   // LC1 lower
        
        // LC2 – between col-A and col-B tables (nodes 3, 10, 11, 12, 13)
        {id: 10, x: 520, y: 410},   // LC2 top
        {id: 11, x: 650, y: 475},   // LC2 upper-mid
        {id: 12, x: 730, y: 515},   // LC2 lower-mid
        {id: 13, x: 860, y: 585},   // LC2 lower
        
        // RC3 – between col-B and col-C tables (nodes 4, 14, 15, 16, 17)
        {id: 14, x: 680, y: 340},   // RC3 top
        {id: 15, x: 800, y: 400},   // RC3 upper-mid
        {id: 16, x: 890, y: 445},   // RC3 lower-mid
        {id: 17, x: 1010, y: 500},  // RC3 lower
        
        // RC4 – right corridor (nodes 5, 18, 19, 20, 21)
        {id: 18, x: 750, y: 260},   // RC4 top
        {id: 19, x: 880, y: 320},   // RC4 upper-mid
        {id: 20, x: 930, y: 345},   // Customer entry point + RC4 lower-mid
        {id: 21, x: 1080, y: 420},  // RC4 lower

        // Bar / counter — cocktail appears here and robot picks up here
        {id: 22, x: 370, y: 235},   // bar left   (matches COUNTERS id 1)
        {id: 23, x: 400, y: 220},   // bar center (matches COUNTERS id 2)
        {id: 24, x: 445, y: 200},   // bar right  (matches COUNTERS id 3)

        //bar pickup points (same as counter positions, but separate ids for pathfinding) 
        {id: 25, x: 390, y: 300},   // bar pickup left
        {id: 26, x: 440, y: 275},   // bar pickup center
        {id: 27, x: 490, y: 250},   // bar pickup right

        // window level 1
        {id: 28, x: 430, y: 470},

        // down path to window for customer level 1 (not used for pathfinding)

        {id: 29, x: 90, y: 400}, // spawn point for customer (window level 1, outside the restaurant)
        {id: 30, x: 120, y: 380}, // Position in queue
        {id: 31, x: 150, y: 400}, // Position in queue
        {id: 32, x: 180, y: 420}, // Position in queue
        {id: 33, x: 215, y: 440}, // Position in queue
        {id: 34, x: 250, y: 460}, // Position in queue
        {id: 35, x: 290, y: 480}, // Position in queue
        {id: 36, x: 330, y: 500}, // Position in queue
        {id: 37, x: 370, y: 520}, // Position in queue
        {id: 38, x: 410, y: 540}, // window Serving point
        {id: 39, x: 490, y: 590}, // start of path to leave
        {id: 40, x: 650, y: 680}  // end of path to leave
    ],
    
    // Edges that connect the waypoints above (bidirectional)
    WAYPOINT_EDGES: [
        [1, 2],                                         // entry → UC left
        [3, 25], [3, 26], [4, 27], /*[25, 26], [26, 27]*/                    // UC left ↕ bar
        [2, 3], [3, 4], [4, 5],                         // upper corridor →
        [2, 6], [6, 7], [7, 8], [8, 9],                 // LC1 ↓
        [3, 10], [10, 11], [11, 12], [12, 13],          // LC2 ↓
        [4, 14], [14, 15], [15, 16], [16, 17],          // RC3 ↓
        [5, 18], [18, 19], [19, 20], [20, 21],          // RC4 ↓

        [29, 30], [30, 31], [31, 32], [32, 33],         // outside queue →
        [33, 34], [34, 35], [35, 36], [36, 37],         // queue →
        [37, 38], [38, 39], [39, 40]                    // window serving point → exit
    ],

    // Which waypoint id the robot stands at to serve each table
    TABLE_SERVICE: {
        1:  6,   // T1  ← LC1 mid
        2:  7,   // T2  ← LC2 mid
        3:  10,   // T3  ← LC2 upper
        4:  11,   // T4  ← LC2 mid
        5:  14,  // T5  ← LC3 upper
        6:  15,  // T6  ← LC3 mid
        7:  8,   // T7  ← LC2 mid
        8:  9,  // T8  ← LC2 bottom
        9:  12,  // T9  ← LC3 mid
        10: 13,  // T10 ← LC3 bottom
        11: 16,  // T11 ← LC3 lower
        12: 17,  // T12 ← LC4 mid
    },

    // Visual nodes where cocktails appear (drawn on the bar)
    COUNTER_SERVICE: [22, 23, 24],

    // Which pickup waypoint corresponds to each counter node (robot navigates here)
    COUNTER_PICKUP: { 22: 25, 23: 26, 24: 27 },
};

export class Game {
    constructor(canvas, robots, customers, cocktails, ctx) {
        this.canvas = canvas;
        this.robots = robots;
        this.customers = customers;
        this.cocktails = cocktails;
        this.ctx = ctx;

        this.background = new Image();
        this.background.src = "./assets/background-2.png";
        this.foreground = new Image();
        this.foreground.src = "./assets/background-1.png";

        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        });
    }

    draw() {
        const scale = Math.min(this.canvas.width / BASE_WIDTH, this.canvas.height / BASE_HEIGHT);
        const offsetX = (this.canvas.width - BASE_WIDTH * scale) / 2;
        const offsetY = (this.canvas.height - BASE_HEIGHT * scale) / 2;

        this.ctx.save();
        this.ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

        this.ctx.drawImage(this.background, 0, 0, BASE_WIDTH, BASE_HEIGHT);

        this.robots.forEach(r => r.draw(this.ctx));
        this.cocktails.forEach(c => c.draw(this.ctx));
        
        this.ctx.drawImage(this.foreground, 0, 0, BASE_WIDTH, BASE_HEIGHT);
        this.customers.forEach(c => c.draw(this.ctx));

        this.ctx.restore();
    }
}