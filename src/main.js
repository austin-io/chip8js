//import Chip8 from "./chip8.js"

let chip;
let romFileInput;

let t = 0;

function setup() {
    chip = new Chip8({fg: "#F652A0", bg: "#4C5270"});
    
    updateResolution();
    
    var cnv = createCanvas(chip.canvasWidth, chip.canvasHeight);
    cnv.parent("#chipCanvasContainer");

    romFileInput = createFileInput(loadRomFile);

}

function draw() {
    background(chip.palette.bg);

    if(t > chip.fps){
        chip.run();
        t = 0;
    }

    t += deltaTime;
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

function loadRomFile(file){
    chip.loadRom(file);
}