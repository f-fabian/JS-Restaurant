export class Cocktail {
    constructor(name, imageSrc) {
        this.name = name;
        this.image = new Image();
        this.image.src = imageSrc;
    }

    draw (ctx, x, y) {
        ctx.drawImage(this.image, x, y, 50, 50);
    }
}