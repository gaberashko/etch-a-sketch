// BOARD CONSTANTS
const DEFAULT_GRID_SIZE = 25;
const MAX_GRID_SIZE = 150;
const TOOL_STRENGTH = 1;
const BLEND_STRENGTH = .20;
const EMPTY_WHITE = "rgb(255, 255, 255)";
// PENCIL MODES
const BLEND_MODE = "blend";
const RAINBOW_MODE = "rainbow";

// INITIAL STATE VARIABLES
let canvasSize = DEFAULT_GRID_SIZE;
let tools = ["Pencil", "Eraser", "Fill", "Match"];
let toolEmojis = ["✏️", "🧼", "🧺", "🎨"]
let toolIndex = 0;
let toolSettings = {
    red: 0,
    green: 0,
    blue: 0,
    strength: TOOL_STRENGTH
};
let modes = {
    [BLEND_MODE]: false,
    [RAINBOW_MODE]: false,
}
let optionCheckboxes = {
  [RAINBOW_MODE]: document.querySelector("#rainbow"),
  [BLEND_MODE]: document.querySelector("#blend"),
};


// Initialize the displays, and begin by creating a grid of size DEFAULT_GRID_SIZE.
let container = document.querySelector(".container");
let rgbVisual = document.querySelector(".rgb-visual");


container.addEventListener("contextmenu", (e) => {
e.preventDefault();
})

let toolDisplay = document.querySelector("#tool-display");
changeGridSize(DEFAULT_GRID_SIZE);

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Assigns the color of a single pixel */
function drawColor(element) {
    let newOpacity = parseFloat(getComputedStyle(element).opacity) + toolSettings.strength;
    let newColor = (modes[RAINBOW_MODE]) ?
        `rgb(${getRandomInteger(0, 255)}, ${getRandomInteger(0, 255)}, ${getRandomInteger(0, 255)})`
        :`rgb(${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue})`;

    if (modes[BLEND_MODE]) {
        // We are assigning a blend-computed color.
        newColor = blendColor(element, newColor);
    } else {
        // We are assigning a solid (non-blend-computed) color.
        if (modes[RAINBOW_MODE] || getComputedStyle(element).backgroundColor !== newColor) {
            // If rainbow mode or different color, override opacity.
            newOpacity = toolSettings.strength;
        }
    }
    // Assign pixel the newly calculated color and opacity.
    element.style.backgroundColor = newColor;
    element.style.opacity = newOpacity;
}

/* Handles the erasing of a pixel. */
function eraseColor(element) {
    element.style.opacity = parseFloat(getComputedStyle(element).opacity) - toolSettings.strength;
}

/* Handles the calculation of final blended RGB value. */
function blendColor(element, color) {
    let curRGB = (getComputedStyle(element).backgroundColor).match(/\d+/g).map((str) => parseInt(str));
    let blendRGB = color.match(/\d+/g).map((str) => parseInt(str));
    // Calculate final RGB value based on tool strength (where 100% strength is midpoint).
    let finalRGB = [Math.floor((curRGB[0] + blendRGB[0])/2),
        Math.floor((curRGB[1] + blendRGB[1])/2),
        Math.floor((curRGB[2] + blendRGB[2])/2)];
    return `rgb(${finalRGB[0]}, ${finalRGB[1]}, ${finalRGB[2]})`;
}

/* Iterate through the canvas and clear all pixels. */
function clearCanvas() {
    let canvasSquares = document.querySelectorAll(".square");

    canvasSquares.forEach((square) => {
        square.style.backgroundColor = EMPTY_WHITE;
        square.style.opacity = 1;
    });
}

/* Take grid size dimension and generate a new canvas. */
function changeGridSize(size) {
    // Create the new squares and append to the container.
    for (let i = 0; i < (size**2); ++i) {
        let square = document.createElement("div");
        square.classList.add("square");
        square.classList.toggle("new");
        square.addEventListener("pointerdown", (e) => {
            if (e.button === 0) {
                 // Draw
                if (tools[toolIndex] === "Pencil") {
                    drawColor(square);
                } else if (tools[toolIndex] === "Eraser") { // Erase
                    eraseColor(square)
                } else if (tools[toolIndex] === "Fill") {
                    floodFill(square);
                } else if (tools[toolIndex] === "Match") {
                    grabColor(square);
                }
            } else if (e.button === 2) {
                grabColor(square);
                e.preventDefault();
            }
        });
        square.addEventListener("pointerenter", (e) => {
            if (e.buttons === 1) {
                // Draw
                if (tools[toolIndex] === "Pencil") {
                    drawColor(square);
                } else if (tools[toolIndex] === "Eraser") { // Erase
                    eraseColor(square);
                }
            }
        });
        // Adjust the square style to create a proper grid.
        square.setAttribute("style", `flex-basis:${(1/size)*100}%; min-height:${(1/size)*100}%;`);
        container.appendChild(square);
    }
    // Replace the previous squares with the new squares.
    let newSquares = document.querySelectorAll(".new");
    container.replaceChildren(...newSquares);
    // Establish the squares as being set.
    newSquares.forEach((element) => {
        element.classList.toggle("new");
        element.classList.toggle("set");
    });
    canvasSize = size;
    updateSettingsDisplay();
    clearCanvas();
}

function grabColor(square) {
    let rgbValues = (getComputedStyle(square).backgroundColor).match(/\d+/g);

    toolSettings.red = parseInt(rgbValues[0]);
    toolSettings.green = parseInt(rgbValues[1]);
    toolSettings.blue = parseInt(rgbValues[2]);
    toolSettings.strength = parseFloat(getComputedStyle(square).opacity);

    toolIndex = 0;
    updateSettingsDisplay();
}

function floodFill(startingSquare) {
    const squares = Array.from(container.children);
    const visited = new Set();
    const squareStack = [];

    let targetRGB = (getComputedStyle(startingSquare).backgroundColor);
    let targetOpacity = parseFloat(getComputedStyle(startingSquare).opacity);
    let startIndex = squares.indexOf(startingSquare);
    squareStack.push(startIndex);

    // Check if the current square is the same as the target. If so, return.
    if (targetRGB === `rgb(${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue})` && equalOpacity(startingSquare, toolSettings.strength)) {
        return;
    }

    while (squareStack.length > 0) {
        let curIndex = squareStack.pop();
        // Color current pixel if not visited.
        // Check adjacent pixels and process those not visited.
        if (visited.has(curIndex)) continue;
        visited.add(curIndex);
        curElement = squares[curIndex];
        curElement.style.backgroundColor = (modes[RAINBOW_MODE]) ?
            `rgb(${getRandomInteger(0, 255)}, ${getRandomInteger(0, 255)}, ${getRandomInteger(0, 255)})` 
            :`rgb(${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue})`;
        curElement.style.opacity = toolSettings.strength;

        let xCoord = curIndex % canvasSize;
        let yCoord = Math.floor(curIndex / canvasSize);
        // Check left adjacent
        if ((xCoord > 0) && equalRGB(squares[curIndex - 1], targetRGB) && equalOpacity(squares[curIndex - 1], targetOpacity))
            squareStack.push(curIndex - 1);
        // Check right adjacent
        if ((xCoord < canvasSize - 1) && equalRGB(squares[curIndex + 1], targetRGB) && equalOpacity(squares[curIndex + 1], targetOpacity))
            squareStack.push(curIndex + 1);
        // Check top adjacent
        if ((yCoord > 0) && equalRGB(squares[curIndex - canvasSize], targetRGB) && equalOpacity(squares[curIndex - canvasSize], targetOpacity))
            squareStack.push(curIndex - canvasSize);
        // Check bottom adjacent
        if ((yCoord < canvasSize - 1) && equalRGB(squares[curIndex + canvasSize], targetRGB) && equalOpacity(squares[curIndex + canvasSize], targetOpacity))
            squareStack.push(curIndex + canvasSize);
    }
}

function equalRGB(a, rgb) {
    return getComputedStyle(a).backgroundColor === rgb;
}

function equalOpacity(a, targetOpacity) {
    return parseFloat(getComputedStyle(a).opacity) === targetOpacity;
}

function getSize() {
    let size;
    do {
        size = Number(prompt(`Please enter grid dimension from 1 to ${MAX_GRID_SIZE}:`)); 
    } while (isNaN(size) || size < 1 || size > MAX_GRID_SIZE || !Number.isSafeInteger(size))
    return size;
}
// Implement logic for grid button.
let gridButton = document.querySelector("#size-button");
gridButton.addEventListener("click", () => {
    let size = getSize();
    changeGridSize(size);});

// Implement the logic for clear button.
let clearButton = document.querySelector("#clear-button");
clearButton.addEventListener("click", () => {
    let clearAudio = new Audio("audio/eraser-woosh.mp3")
    clearAudio.play();
    clearCanvas();});

// Implement the logic for the change tool button.
let toolButton = document.querySelector("#tool-button");
toolButton.addEventListener("click", () => {
    toolIndex = (toolIndex + 1) % tools.length;
    toolDisplay.textContent = `Tool: ${tools[toolIndex]} ${toolEmojis[toolIndex]}`;
});

// Implement logic for pencil slider settings.
let settingInputs = document.querySelectorAll(".range-setting");
settingInputs.forEach((settingInput) => {
    settingInput.addEventListener("input", (event) => {
        // Set corresponding attribute value.
        let propertyId = event.target.getAttribute("id");
        toolSettings[propertyId] = parseFloat(settingInput.value);
        // Speeds up performance by only modifying animation when in rainbow mode, and opacity
        // changes.
        if (propertyId === "strength" && modes[RAINBOW_MODE]) {
            updateRainbowAnimation();
        }
        // Update the website display of attribute values.
        updateSettingsDisplay();
    });
});

// Implement logic for rainbow checkbox.
let rainbowCheckbox = document.querySelector("#rainbow");
rainbowCheckbox.addEventListener("change", ()=> {
    toggleOption(RAINBOW_MODE, true);
});

// Implement logic for blend checkbox.
let blendCheckbox = document.querySelector("#blend");
blendCheckbox.addEventListener("change", ()=> {
    toggleOption(BLEND_MODE, true);
});

// Implement color wheel logic.
let colorWheel = document.querySelector("#color-wheel");
colorWheel.addEventListener("change", ()=> {
    // Capture the RGB values from the color wheel.
    let colorValue = colorWheel.value;
    let redValue = parseInt(colorValue.substr(1,2), 16);
    let greenValue = parseInt(colorValue.substr(3,2), 16);
    let blueValue = parseInt(colorValue.substr(5,2), 16);

    // Update the RGB value and refresh display.
    toolSettings.red = redValue;
    toolSettings.green = greenValue;
    toolSettings.blue = blueValue;

    updateSettingsDisplay();
})

// General handler for toggling drawing modes (rainbow, blend).
function toggleOption(option, clicked) {
    let chosenCheckbox = optionCheckboxes[option];
    chosenCheckbox.checked = (!chosenCheckbox.checked) ? !clicked : clicked;
    // Now set the tool mode.
    modes[option] = chosenCheckbox.checked;
    
    updateSettingsDisplay();
}

function updateRainbowAnimation() {
    document.documentElement.style.setProperty('--strength', toolSettings.strength);
}

function updateSettingsDisplay() {
    let rgbText = document.querySelector(".pencil-detail-rgb");
    let strengthText = document.querySelector(".pencil-detail-strength");
    let rgbVisual = document.querySelector(".rgb-visual");
    let canvasSizeText = document.querySelector(".canvas-dimension");
    let redValueSlider = document.querySelector("#red");
    let greenValueSlider = document.querySelector("#green");
    let blueValueSlider = document.querySelector("#blue");
    let strengthValueSlider = document.querySelector("#strength");

    if (!modes[RAINBOW_MODE] && rgbVisual.classList.contains("rgb-visual-animated")) {
        rgbVisual.classList.toggle("rgb-visual-animated");
    } else if (modes[RAINBOW_MODE] && !rgbVisual.classList.contains("rgb-visual-animated")) {
        rgbVisual.classList.toggle("rgb-visual-animated");
    }

    redValueSlider.value = toolSettings.red;
    greenValueSlider.value = toolSettings.green;
    blueValueSlider.value = toolSettings.blue;
    strengthValueSlider.value = toolSettings.strength;
    toolDisplay.textContent = `Tool: ${tools[toolIndex]} ${toolEmojis[toolIndex]}`;
    

    rgbText.textContent = `RGB: (${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue})`;
    strengthText.textContent = `Strength: ${parseInt((toolSettings.strength) * 100)}%`;
    
    rgbVisual.style.backgroundColor = `rgba(${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue}, ${toolSettings.strength})`;

    canvasSizeText.textContent = `Canvas: ${canvasSize} x ${canvasSize}`;
}

// Implement download button.
let downloadButton = document.querySelector("#download-button");
downloadButton.addEventListener("click", function() {
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    let containerWidth = container.offsetWidth;
    let containerHeight = container.offsetHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    let squares = document.querySelectorAll(".square");
    let squareSize = containerWidth / Math.sqrt(squares.length);

    squares.forEach((square, index) => {
        let col = index % canvasSize;
        let row = Math.floor(index / canvasSize);
        let color = window.getComputedStyle(square).backgroundColor;
        let opacity = parseFloat(window.getComputedStyle(square).opacity);

        context.fillStyle = color;
        context.globalAlpha = opacity;
        context.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
    });

    // Convert canvas to PNG and trigger download
    let image = canvas.toDataURL("image/png");
    let link = document.createElement("a");
    link.href = image;
    link.download = "canvas.png";
    link.click();
});

window.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "b":
            toggleOption(BLEND_MODE, false);
            break;
        case "r":
            toggleOption(RAINBOW_MODE, false);
            break;
    }
});