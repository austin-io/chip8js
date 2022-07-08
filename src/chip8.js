function mod(a, n){
    return ((a % n) + n) % n;
}

class Chip8 {
    constructor(palette){
        this.palette = palette;

        this.screenWidth = 64;
        this.screenHeight = 32;

        this.paused = true;

        // 64 x 32 display buffer
        this.display = [...new Array(this.screenHeight * this.screenWidth)];
        this.display.fill(false);

        this.buffers = [
            this.display,
            [...this.display]
        ]

        this.displayIndex = 0;
        this.swapIndex = 1;
        this.useSwapBuffer = true;

        // 4KB of memory
        this.ram = [...new Array(0xFFF)];
        this.ram.fill(0x0);

        // Fill ram with font data
        var fontData = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0, address =  0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1, address =  5
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
        ]
        
        for(var i = 0; i < fontData.length; i++){
            this.ram[i] = fontData[i];
        }

        // Stack memory
        this.stack = [...new Array(16)];
        this.stack.fill(0);

        // V registers
        this.registers = [...new Array(16)];
        this.registers.fill(0);

        this.pc = 0x200;    // Program Counter
        this.sp = 0;    // Stack Pointer
        this.index = 0; // Index Memory Pointer
        this.st = 0;    // Sound Timer
        this.dt = 0;    // Delay Timer

        this.keys = [
            88,         // X
            49,         // 1
            50,         // 2
            51,         // 3
            81,         // q
            87,         // w
            69,         // e
            65,         // a
            83,         // s
            68,         // d
            90,         // z
            67,         // c
            52,         // 4
            82,         // r
            70,         // f
            86          // v
        ];

        this.keyLookup = {
            88: 0,
            49: 1,
            50: 2,
            51: 3,
            81: 4,
            87: 5,
            69: 6,
            65: 7,
            83: 8,
            68: 9,
            90: 10,
            67: 11,
            52: 12,
            82: 13,
            70: 14,
            86: 15 
        }

        this.sfx = new p5.Pulse(300, 0.5);

        this.canvasWidth = 64;
        this.canvasHeight = this.canvasWidth / 2;

        this.pixelSize = 1;
        this.fps = 1/30;
        this.waitingForKey = false;
        this.lastX = 0;
        this.lastKey = 0;

        this.delayTime = 0;
        this.soundTime = 0;
        this.mainTime = 0;

    }

    drawDisplay(){
        for(var y = 0; y < this.screenHeight; y++){
            for(var x = 0; x < this.screenWidth; x++){
                if(!this.getPixel(x,y))
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

    swap(){
        var tmp = this.displayIndex;
        this.displayIndex = this.swapIndex;
        this.swapIndex = tmp;
    }

    printOp(op){
        console.log("[PC]: " + this.pc + " | [OP]: 0x" + op.toString(16).toUpperCase());
    }

    setPixel(x, y, value){
        //this.display[y * this.screenWidth + x] = value;
        this.buffers[this.swapIndex][y * this.screenWidth + x] = value;
    }

    getPixel(x,y){
        //return this.display[y * this.screenWidth + x];
        return this.buffers[this.swapIndex][y * this.screenWidth + x];
    }

    clearDisplay(){
        for(var i = 0; i < this.buffers[this.swapIndex].length; i++){
            //this.display[i] = false;
            this.buffers[this.swapIndex][i] = false;
        }

        if(this.useSwapBuffer)
            this.swap()
    }

    clearRam(){
        for(var i = 0x200; i < this.ram.length; i++){
            this.ram[i] = 0;
        }
    }

    loadRom(file){
        this.paused = true;
        this.pc = 0x200;

        var reader = new FileReader();
        reader.onload = (e) => {
            // binary data
            //console.log(e.target.result);
            this.clearRam();
            for(var i = 0; i < e.target.result.length; i++){
                this.ram[0x200 + i] = (e.target.result[i]).charCodeAt(0);
            }
            this.pc = 0x200;

            this.ram[0x1FF] = 4;
            this.ram[0x1FE] = 1;
            this.paused = false;

            console.log("Load Complete");
            console.log(this.ram);
        };
        reader.onerror = (e) => {
            // error occurred
            console.log('Error : ' + e.type);
        };
        reader.readAsBinaryString(file.file);
        this.clearDisplay();

    }

    checkinput(X){

        if(keyCode in this.keyLookup)
            this.registers[X] = this.keyLookup[keyCode];
        else
            this.registers[X] = 0;

        this.waitingForKey = false;
        //this.pc += 2;
    
    }

    run(delta){

        this.drawDisplay();

        if(this.paused)
            return;

        if(this.delayTime >= 0.016666){
            this.delayTime = 0;
            if(this.dt > 0){
                this.dt--;
                return;
            }

            if(this.st > 0)
                this.st--;
        }

        this.delayTime += delta;

        if(this.mainTime < this.fps){
            this.mainTime += delta;
            return;
        }

        this.mainTime = 0;

        var instruction = this.ram[this.pc] << 8 | this.ram[this.pc+1];
        var code = instruction & 0xF000;
        var X = (instruction & 0x0F00) >> 8;
        var Y = (instruction & 0x00F0) >> 4;
        var n = instruction & 0x000F;
        var nn = instruction & 0x00FF;
        var nnn = instruction & 0x0FFF;

        if(this.waitingForKey){
            //this.checkinput(this.lastX);
            return;
        }

        //if(instruction == 0)
            //return;

        //if(!this.paused)
        this.printOp(instruction);
        this.pc += 2;

        switch(code){
            case 0x0000:
                if(nn === 0xE0){             // CLS 00E0
                    this.clearDisplay();
                } else if(nn === 0xEE){      // RET 00EE
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
                if(this.registers[X] === nn)
                    this.pc += 2;
                break;
            
            case 0x4000:                    // SNE 4XNN
                if(this.registers[X] != nn)
                    this.pc += 2;
                break;
            
            case 0x5000:                    // SE 5XY0
                if(this.registers[X] === this.registers[Y])
                    this.pc += 2;
                break;
            
            case 0x6000:                    // LD 6XNN
                this.registers[X] = nn;
                break;

            case 0x7000:                    // ADD 7XNN
                this.registers[X] += nn;
                this.registers[X] &= 0xFF; 

                break;

            case 0x8000:
                switch(n){
                    case 0x0:                 // LD 8XY0
                        this.registers[X] = this.registers[Y];
                        break;
                    case 0x1:                 // OR 8XY1
                        this.registers[X] |= this.registers[Y];
                        this.registers[0xF] = 0;
                        break;
                    case 0x2:                 // AND 8XY2
                        this.registers[X] &= this.registers[Y];
                        this.registers[0xF] = 0;
                        break;
                    case 0x3:                 // XOR 8XY3
                        this.registers[X] ^= this.registers[Y];
                        this.registers[0xF] = 0;
                        break;
                    case 0x4:                 // ADD 8XY4
                        this.registers[X] += this.registers[Y];
                        if(this.registers[X] > 0xFF)
                            this.registers[0xF] = 1;
                        else 
                            this.registers[0xF] = 0;
                        this.registers[X] &= 0xFF; 
                        break;
                    case 0x5:                 // SUB 8XY5
                        var setCarry = this.registers[X] > this.registers[Y];
                        this.registers[X] -= this.registers[Y];

                        if(setCarry)
                            this.registers[0xF] = 1;
                        else 
                            this.registers[0xF] = 0;

                        this.registers[X] &= 0xFF; 

                        break;
                    case 0x6:                 // SHR 8XY6
                        var shiftBit = this.registers[X] & 0x1;
                        this.registers[X] = this.registers[X] >> 1;
                        this.registers[0xF] = shiftBit;

                        break;
                    case 0x7:                 // SUBN 8XY7
                        var setCarry = this.registers[Y] > this.registers[X]
                        this.registers[X] = this.registers[Y] - this.registers[X];
                    
                        if(setCarry)
                            this.registers[0xF] = 1;
                        else 
                            this.registers[0xF] = 0;

                        this.registers[X] &= 0xFF; 

                        break;
                    case 0xE:               // SHL 8XYE
                        var shiftBit = this.registers[X] & 0x80;
                        this.registers[X] = this.registers[X] << 1;
                        this.registers[0xF] = shiftBit > 0 ? 1 : 0;
                        this.registers[X] &= 0xFF; 

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
                this.pc = this.registers[X] + nnn;
                break; 
            
            case 0xC000:                    // RND VX,NN - CXNN 
                this.registers[X] = (Math.random() * 256) & nn;
                break;

            case 0xD000:                    // DRW VX,VY,N - DXYN
                this.registers[0xF] = 0;
                
                var spriteX = mod(this.registers[X], this.screenWidth);
                var spriteY = mod(this.registers[Y], this.screenHeight);

                for(var row = 0; row < n; row++){
                    var spriteLine = this.ram[this.index + row] & 0xFF;
                    var pixelY = mod((spriteY + row), this.screenHeight);

                    for(var col = 0; col < 8; col++){
                        var pixelX = mod((spriteX + col), this.screenWidth);
                        var pixelBit = (spriteLine & (1 << (7 - col))) > 0;
                        var currentPixel = this.getPixel(pixelX,pixelY);
                        
                        this.setPixel(
                            pixelX, pixelY, 
                            (currentPixel ^ pixelBit) > 0); // xor sprite pixels with display
                        
                        if(pixelBit){
                            if(pixelBit === currentPixel)
                                this.registers[0xF] = 1;
                        }

                        if(pixelX === this.screenWidth - 1)
                            break;
                        
                    }

                    if(pixelY === this.screenHeight - 1)
                        break;
                }
        
                this.drawDisplay();

                break;
            
            case 0xE000:
                if(nn === 0x9E){              // SKP VX - EX9E
                    // Skip next if key is pressed
                    if(keyIsDown(this.keys[this.registers[X]])){
                        this.pc += 2;
                    }
                } else if(nn === 0xA1){      // SKNP VX - EXA1
                    if(!keyIsDown(this.keys[this.registers[X]])){ 
                        this.pc += 2;
                    }
                }
                break;

            case 0xF000:
                switch(nn){
                    case 0x07:              // LD VX, DT - FX07
                        this.registers[X] = this.dt;
                        break;
                    case 0x0A:              // LD VX, K - FX0A 
                        this.waitingForKey = true;
                        this.lastX = X;
                        break;
                    case 0x15:              // LD DT, VX - FX15
                        this.dt = this.registers[X];
                        break;
                    case 0x18:              // LD ST, VX - FX18
                        this.st = this.registers[X];
                        break;
                    case 0x1E:              // ADD I, VX - FX1E
                        this.index += this.registers[X];
                        this.index &= 0xFFF;
                        break;
                    case 0x29:              // LD F, VX - FX29
                        this.index = (this.registers[X] * 5) & 0xFF;
                        break;
                    case 0x33:              // LD B, VX - FX33
                        var h = (this.registers[X] / 100) & 0xFFF;
                        var t = ((this.registers[X] - (h * 100)) / 10) & 0xFF;
                        var o = (this.registers[X] - (h * 100) - (t * 10)) & 0xFF;
                        this.ram[this.index] = h;
                        this.ram[this.index + 1] = t;
                        this.ram[this.index + 2] = o;
                        break;
                    case 0x55:              // LD [I], VX - FX55
                        for(var i = 0; i <= X; i++){
                            this.ram[this.index + i] = this.registers[i] & 0xFF;
                        }
                        this.index = (this.index + X + 1) & 0xFFF;
                        break;
                    case 0x65:              // LD VX, [I] - FX65
                        for(var i = 0; i <= X; i++){
                            this.registers[i] = this.ram[this.index + i] & 0xFF;
                        }
                        this.index = (this.index + X + 1) & 0xFFF;
                        break;
                }    

                break;
        }

        if(this.st > 0){
            this.sfx.start();
            this.st--;
        } else {
            this.sfx.stop();
        }

        this.lastKey = this.registers[X];

        if(this.pc >= this.ram.length)
            this.pc = 0x200;

    }
    
}