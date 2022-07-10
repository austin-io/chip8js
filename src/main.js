//import Chip8 from "./chip8.js"

let chip;
let romFileInput;

let fg = "#F652A0";
let bg = "#4C5270";

let emuTime = 0;

let lastTime = (new Date()).getTime();

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

    frameRate(999);

    romFileInput = createFileInput(loadRomFile);
    romFileInput.parent("#fileInputContainer");
    romFileInput.id("fileInput");
    romFileInput.style("display: none;");

}

function gameLoop(){
    var currentTime = 0;
    for(var i = 0; i < 1000; i++){
        currentTime = (new Date()).getTime();
        chip.run(max((currentTime - lastTime) / 1000, 0.001));
        lastTime = currentTime;

        if(chip.redraw)
            break;
    }
    chip.drawDisplay();
    chip.redraw = false;
}

function draw() {
    background(chip.palette.bg);

    //chip.updateKeys();

    gameLoop();
    //chip.drawDisplay();

    //chip.run(deltaTime);
    
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

    fetch(`roms/${romFiles[e.value]}`)
		.then(r => r.blob())
		.then(blob => {
			var f = new File([blob], romFiles[e.value]);
            chip.loadRom(new p5.File(f));
		});

}

document.addEventListener("keydown", e => {
    if(e.keyCode in chip.keyLookup)
        chip.keyState[chip.keyLookup[e.keyCode]] = true;
});

document.addEventListener("keyup", e => {
    if(e.keyCode in chip.keyLookup)
        chip.keyState[chip.keyLookup[e.keyCode]] = false;

    if(!chip.waitingForKey)
        return;

    chip.checkinput(chip.lastX, e.keyCode);
});

function resetChip(){
    chip = new Chip8({fg: fg, bg: bg});
    chip.fps = 0;
    updateResolution();
    console.log("Reset Chip8");
}

function updateColors(e, id){
    if(id == 0){
        fg = e.value;
        chip.palette.fg = e.value;
    } else{
        bg = e.value;
        chip.palette.bg = e.value;
    }

}