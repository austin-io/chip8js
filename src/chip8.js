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

        // Fill ram with font data
        this.ram.splice(0,0, ...[
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0, address = 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1, address = 5
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2, address = 10
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3, address = 15
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4, address = 20
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5, address = 25
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6, address = 30
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7, address = 35
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8, address = 40
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9, address = 45
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A, address = 50
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B, address = 55
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C, address = 60
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D, address = 65
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E, address = 70
            0xF0, 0x80, 0xF0, 0x80, 0x80, // F, address = 75
        ])

        // Stack memory
        this.stack = [...new Array(16)];
        this.stack.fill(0);

        // V registers
        this.registers = [...new Array(16)];
        this.registers.fill(0);

        this.pc = 0;    // Program Counter
        this.sp = 0;    // Stack Pointer
        this.index = 0; // Index Memory Pointer
        this.st = 0;    // Sound Timer
        this.dt = 0;    // Delay Timer

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

    loadRom(file){
        this.pc = 0x200;

        this.ram[0x200] = 0x0a;
        this.ram[0x201] = 0xbc;
    }

    run(){

        var instruction = this.ram[this.pc] << 8 | this.ram[this.pc+1];
        var code = instruction & 0xF000;
        var X = (instruction & 0x0F00) >> 8;
        var Y = (instruction & 0x00F0) >> 4;
        var n = instruction & 0x000F;
        var nn = instruction & 0x00FF;
        var nnn = instruction & 0x0FFF;

        switch(code){
            case 0x0000:
                if(nn == 0xE0){             // CLS 00E0
                    this.clearDisplay();
                } else if(nn == 0xEE){      // RET 00EE
                    this.pc = this.stack[this.sp];
                    if(this.sp > 0)
                        this.sp--;
                }
                break;

            case 0x1000:                    // JMP 1NNN
                this.pc = nnn;
                break;

            case 0x2000:                    // CALL 2NNN
                this.sp++;
                this.stack[this.sp] = this.pc;
                this.pc = nnn;
                break;

            case 0x3000:                    // SE 3XNN
                if(this.registers[X] == nn)
                    this.pc += 2;
                break;
            
            case 0x4000:                    // SNE 4XNN
                if(this.registers[X] != nn)
                    this.pc += 2;
                break;
            
            case 0x5000:                    // SE 5XY0
                if(this.registers[X] == this.registers[Y])
                    this.pc += 2;
                break;
            
            case 0x6000:                    // LD 6XNN
                this.registers[X] = nn;
                break;

            case 0x7000:                    // ADD 7XNN
                this.registers[X] += nn;
                break;

            case 0x8000:
                switch(n){
                    case 0:                 // LD 8XY0
                        this.registers[X] = this.registers[Y];
                        break;
                    case 1:                 // OR 8XY1
                        this.registers[X] |= this.registers[Y];
                        break;
                    case 2:                 // AND 8XY2
                        this.registers[X] &= this.registers[Y];
                        break;
                    case 3:                 // XOR 8XY3
                        this.registers[X] ^= this.registers[Y];
                        break;
                    case 4:                 // ADD 8XY4
                        this.registers[X] += this.registers[Y];
                        if(this.registers[X] > 0xFF)
                            this.registers[0xF] = 1;
                        else 
                            this.registers[0xF] = 0;
                        break;
                    case 5:                 // SUB 8XY5
                        if(this.registers[X] > this.registers[Y])
                            this.registers[0xF] = 1;
                        else 
                            this.registers[0xF] = 0;

                        this.registers[X] -= this.registers[Y];
                        break;
                    case 6:                 // SHR 8XY6
                        this.registers[0xF] = this.registers[X] & 1;
                        this.registers[X] = this.registers[X] >> 1;

                        break;
                    case 7:                 // SUBN 8XY7
                        if(this.registers[Y] > this.registers[X])
                            this.registers[0xF] = 1;
                        else 
                            this.registers[0xF] = 0;

                        this.registers[X] = this.registers[Y] - this.registers[X];
                        break;
                    case 0xE:               // SHL 8XYE
                        this.registers[0xF] = this.registers[X] & 0x80;
                        this.registers[X] = this.registers[X] << 1;
                        break;
                }
                break;

            case 0x9000:                    // SNE VX,VY - 9XY0
                if(this.registers[X] != this.registers[Y])
                    this.pc += 2;
                break;

            case 0xA000:                    // LD I,NNN - ANNN
                this.index = nnn;
                break;
            
            case 0xB000:                    // JMP V0,NNN - BNNN
                this.pc = this.registers[0] + nnn;
                break; 
            
            case 0xC000:                    // RND VX,NN - CXNN
                this.registers[X] = (Math.random() * 256) & nn;
                break;

            case 0xD000:                    // DRW VX,VY,N - DXYN
                var spriteX = this.registers[X] % this.screenWidth;
                var spriteY = this.registers[Y] % this.screenHeight;

                for(var row = 0; row < n; row++){
                    var spriteLine = this.ram[this.index + row];
                    var pixelY = (spriteY + row) % this.screenHeight;

                    for(var col = 0; col < 8; col++){
                        var pixelX = (spriteX + col) % this.screenWidth;
                        var pixelBit = (spriteLine & (1 << 7 - col)) > 0;
                        this.setPixel(
                            pixelX, pixelY, 
                            (this.getPixel(pixelX,pixelY) ^ pixelBit) > 0); // xor sprite pixels with display
                        
                        if(pixelBit == this.getPixel(pixelX,pixelY))
                            this.registers[0xF] = 1;

                        if(pixelX == this.screenWidth - 1)
                            break;
                        
                    }

                    if(pixelY == this.screenHeight - 1)
                        break;
                }
        
                this.drawDisplay();

                break;
        }

        this.drawDisplay();
    }
    
}