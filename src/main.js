//import Chip8 from "./chip8.js"

let chip;

function setup() {
    chip = new Chip8({fg: "#F652A0", bg: "#4C5270"});
    
    updateResolution();
    
    var cnv = createCanvas(chip.canvasWidth, chip.canvasHeight);
    cnv.parent("#chipCanvasContainer");
    
    chip.setPixel(5,5,true);
    chip.loadRom(null);
}

function draw() {
    background(chip.palette.bg);
    chip.run();
}

function updateResolution(){
    chip.canvasWidth = min(windowWidth, 1280);
    chip.canvasHeight = chip.canvasWidth / 2;
    chip.pixelSize = chip.canvasWidth / 64;
}

function windowResized(){
    updateResolution();
    resizeCanvas(chip.canvasWidth, chip.canvasHeight);
}