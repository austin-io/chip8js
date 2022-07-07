class Chip8 {
    constructor(palette){
        this.palette = palette;

        this.screenWidth = 64;
        this.screenHeight = 32;

        // 64 x 32 display buffer
        this.display = [...new Array(this.screenHeight * this.screenWidth)];
        this.display.fill(false);

        // 4KB of memory
        this.ram = [...new Array(0xFFF)];
        this.ram.fill(0);

        // Stack memory
        this.stack = [...new Array(16)];
        this.stack.fill(0);

        // V registers
        this.registers = [...new Array(16)];
        this.registers.fill(0);

        this.canvasWidth = 64;
        this.canvasHeight = this.canvasWidth / 2;

        this.pixelSize = 1;

    }

    drawDisplay(){
        for(var y = 0; y < this.screenHeight; y++){
            for(var x = 0; x < this.screenWidth; x++){
                if(!this.display[y * this.screenWidth + x])
                    continue;
                noStroke();
                fill(this.palette.fg);
                rect(
                    x * this.pixelSize,
                    y * this.pixelSize,
                    this.pixelSize,
                    this.pixelSize,
                    );
            }
        }
    }

    setPixel(x, y, value){
        this.display[y * this.screenWidth + x] = value;
    }

    getPixel(x,y){
        return this.display[y * this.screenWidth + x];
    }

    clearDisplay(){
        for(var i = 0; i < this.display.length; i++){
            this.display[i] = false;
        }
    }
    
}