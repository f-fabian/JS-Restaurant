// sprite.js — sprite-sheet loader and direction helper
//
// Sheet layout: 12 columns (animation frames) × 8 rows (directions).
// User-confirmed usable rows (1-indexed): 1, 3, 5, 7  →  0-indexed: 0, 2, 4, 6
//
//   Row 0 → SW  (moving screen-left + screen-down)
//   Row 2 → SE  (moving screen-right + screen-down)
//   Row 4 → NE  (moving screen-right + screen-up)
//   Row 6 → NW  (moving screen-left + screen-up)

export const SPRITE_COLS = 12;
export const SPRITE_ROWS = 8;

export class Sprite {
    constructor(src, cols = SPRITE_COLS, rows = SPRITE_ROWS) {
        this.cols   = cols;
        this.rows   = rows;
        this.frameW = 0;
        this.frameH = 0;
        this.img    = new Image();
        this.img.onload = () => {
            this.frameW = this.img.width  / cols;
            this.frameH = this.img.height / rows;
        };
        this.img.src = src;
    }

    get loaded() { return this.frameW > 0; }

    /**
     * Draw one frame at (destX, destY).
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} col  - frame column (0-indexed, animation frame)
     * @param {number} row  - row index (0-indexed, direction)
     * @param {number} destX
     * @param {number} destY
     * @param {number} scale
     */
    draw(ctx, col, row, destX, destY, scale = 1) {
        if (!this.loaded) return;
        ctx.drawImage(
            this.img,
            col * this.frameW, row * this.frameH,
            this.frameW,       this.frameH,
            destX,             destY,
            this.frameW * scale,
            this.frameH * scale,
        );
    }
}

/**
 * Returns the 0-indexed sprite-sheet row for the given screen-space movement vector.
 * @param {number} dx  - horizontal delta (positive = right)
 * @param {number} dy  - vertical delta   (positive = down)
 */
export function directionRow(dx, dy) {
    if (dx >= 0 && dy >= 0) return 0;  // SE
    if (dx <  0 && dy >= 0) return 2;  // SW
    if (dx >= 0 && dy <  0) return 6;  // NE
    return 4;                          // NW  (dx < 0 && dy < 0)
}
