//import Chip8 from "./chip8.js"

let chip;
let romFileInput;

let emuTime = 0;

let romFiles = [
    "test.ch8",
    "pong.ch8",
    "maze.ch8",
    "tetris.ch8",
    "brix.ch8"
];

function setup() {
    chip = new Chip8({fg: "#F652A0", bg: "#4C5270"});
    
    updateResolution();
    
    var cnv = createCanvas(chip.canvasWidth, chip.canvasHeight);
    cnv.parent("#chipCanvasContainer");

    frameRate(120);
    chip.fps = 0;

    romFileInput = createFileInput(loadRomFile);
    romFileInput.parent("#fileInputContainer");
    romFileInput.id("fileInput");
    romFileInput.style("display: none;");

}

function draw() {
    background(chip.palette.bg);

    chip.run(deltaTime);
    
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

function loadRomDropdown(e){
    resetChip();
    //var f = new File(romFiles[e.value]);
    //chip.loadRom(new p5.File(f));

    fetch(`chip8js/roms/${romFiles[e.value]}`)
		.then(r => r.blob())
		.then(blob => {
			var f = new File([blob], romFiles[e.value]);
            chip.loadRom(new p5.File(f));
		});

}

function keyPressed(){
    //chip.run();
    console.log(chip);
}

function keyReleased(){
    if(!chip.waitingForKey)
        return;
    chip.checkinput(chip.lastX);
}

function resetChip(){
    chip = new Chip8({fg: "#F652A0", bg: "#4C5270"});
    chip.fps = 0;
    updateResolution();
    console.log("Reset Chip8");
}

function updateColors(e, id){
    if(id == 0)
        chip.palette.fg = e.value;
    else
        chip.palette.bg = e.value;

}