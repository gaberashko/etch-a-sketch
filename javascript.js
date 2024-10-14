// Board constants.
const DEFAULT_GRID_SIZE = 25;
const MAX_GRID_SIZE = 150;
const TOOL_STRENGTH = .20;
const BLEND_STRENGTH = .20;
const EMPTY_WHITE = "rgb(255, 255, 255)";


// State variables
let tools = ["Pencil", "Eraser", "Fill", "Match"];
let toolIndex = 0;
let rainbowMode = false;
let blendMode = false;
let canvasSize = DEFAULT_GRID_SIZE;
let toolSettings = {
    red: 0,
    green: 0,
    blue: 0,
    strength: TOOL_STRENGTH
};

// Initialize the displays, and begin by creating a grid of size DEFAULT_GRID_SIZE.
let container = document.querySelector(".container");
let toolDisplay = document.querySelector("#tool-display");
changeGridSize(DEFAULT_GRID_SIZE);

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomizeColor(element) {
    element.style.backgroundColor = `rgb(${getRandomInteger(0, 255)}, ${getRandomInteger(0, 255)}
    , ${getRandomInteger(0, 255)})`;
    element.style.opacity = parseFloat(getComputedStyle(element).opacity)
                    + toolSettings.strength;
}

function drawColor(element) {
    // Opacity will not be reset, and instead, the RGB values will be meshed algorithmically.
    if (blendMode) {
        let blendedColor = blendColor(element);
        element.style.opacity = parseFloat(getComputedStyle(element).opacity) + toolSettings.strength;
        element.style.backgroundColor = `rgb(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]})`;
    } else {
        if (getComputedStyle(element).backgroundColor === `rgb(${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue})`) {
            element.style.opacity = parseFloat(getComputedStyle(element).opacity) + toolSettings.strength;
        } else {
            element.style.opacity = toolSettings.strength;
        }
        element.style.backgroundColor = `rgb(${toolSettings.red},${toolSettings.green},${toolSettings.blue})`;
    }
}

function blendColor(element) {
    let curRGB = (getComputedStyle(element).backgroundColor).match(/\d+/g);
    let blendedRGB;
    blendedRGB = (parseInt(curRGB[0]) === 255 && parseInt(curRGB[1]) === 255 && parseInt(curRGB[2]) === 255) ? [toolSettings.red, toolSettings.green, toolSettings.blue] : [Math.floor((parseInt(curRGB[0]) + toolSettings.red)/2),
        Math.floor((parseInt(curRGB[1]) + toolSettings.green)/2),
        Math.floor((parseInt(curRGB[2]) + toolSettings.blue)/2)];
    return blendedRGB;
}

function clearCanvas() {
    let canvasSquares = document.querySelectorAll(".square");
    canvasSquares.forEach((square) => {
        square.style.backgroundColor = EMPTY_WHITE;
        square.style.opacity = 0;
    });
}

function changeGridSize(size) {
    let oldSquares = document.querySelector(".set");
    // Create the new squares and append to the container.
    for (let i = 0; i < (size**2); ++i) {
        let square = document.createElement("div");
        square.classList.add("square");
        square.classList.toggle("new");
        square.addEventListener("pointerdown", (e) => {
            // Draw
            if (tools[toolIndex] === "Pencil") {
                (rainbowMode) ? randomizeColor(square) : drawColor(square);
            } else if (tools[toolIndex] === "Eraser") { // Erase
                square.style.opacity = parseFloat(getComputedStyle(square).opacity) 
                - toolSettings.strength;
            } else if (tools[toolIndex] === "Fill") {
                floodFill(square);
            } else if (tools[toolIndex] === "Match") {
                grabColor(square);
            }
            square.releasePointerCapture(e.pointerId);
        });
        square.addEventListener("pointerenter", (event) => {
            if (event.buttons === 1) {
                // Draw
                if (tools[toolIndex] === "Pencil") {
                    (rainbowMode) ?  randomizeColor(square) : drawColor(square);
                } else if (tools[toolIndex] === "Eraser") { // Erase
                    square.style.opacity = parseFloat(getComputedStyle(square).opacity) 
                    - toolSettings.strength;
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
}

function grabColor(square) {
    let rgbValues = (getComputedStyle(square).backgroundColor).match(/\d+/g);
    toolSettings.red = rgbValues[0];
    toolSettings.green = rgbValues[1];
    toolSettings.blue = rgbValues[2];
    toolSettings.strength = parseFloat(getComputedStyle(square).opacity);
    toolIndex = 0;
    updateSettingsDisplay();
}

function floodFill(startingSquare) {
    let targetRGB = (getComputedStyle(startingSquare).backgroundColor);
    let targetOpacity = parseFloat(getComputedStyle(startingSquare).opacity);
    const squareStack = [];
    squareStack.push(startingSquare);

    while (squareStack.length > 0) {
        // Color the current pixel selected.
        let curElement = squareStack.pop();
        curElement.style.backgroundColor = `rgb(${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue})`;
        curElement.style.opacity = toolSettings.strength;
        // Check adjacent pixels.
        let curIndex = Array.from(container.children).indexOf(curElement);
        let xCoord = curIndex % canvasSize;
        let yCoord = Math.floor(curIndex / canvasSize);
        // Check left adjacent
        if ((xCoord > 0) && equalRGB(container.children[curIndex - 1], targetRGB) && equalOpacity(container.children[curIndex - 1], targetOpacity))
            squareStack.push(container.children[curIndex - 1]);
        // Check right adjacent
        if ((xCoord < canvasSize - 1) && equalRGB(container.children[curIndex + 1], targetRGB) && equalOpacity(container.children[curIndex + 1], targetOpacity))
            squareStack.push(container.children[curIndex + 1]);
        // Check top adjacent
        if ((yCoord > 0) && equalRGB(container.children[curIndex - canvasSize], targetRGB) && equalOpacity(container.children[curIndex - canvasSize], targetOpacity))
            squareStack.push(container.children[curIndex - canvasSize]);
        // Check bottom adjacent
        if ((yCoord < canvasSize - 1) && equalRGB(container.children[curIndex + canvasSize], targetRGB) && equalOpacity(container.children[curIndex + canvasSize], targetOpacity))
            squareStack.push(container.children[curIndex + canvasSize]);
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
    } while (isNaN(size) || size < 1 || size > MAX_GRID_SIZE)
    return size;
}
// Implement logic for grid button.
let gridButton = document.querySelector("#size-button");
gridButton.addEventListener("click", () => {
    let size = getSize();
    changeGridSize(size);});

// Implement the logic for clear button.
let clearButton = document.querySelector("#clear-button");
clearButton.addEventListener("click", clearCanvas);

// Implement the logic for the change tool button.
let toolButton = document.querySelector("#tool-button");
toolButton.addEventListener("click", () => {
    toolIndex = (toolIndex + 1) % tools.length;
    toolDisplay.textContent = `Tool: ${tools[toolIndex]}`;
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
        if (propertyId === "strength" && rainbowMode) {
            updateRainbowAnimation();
        }
        // Update the website display of attribute values.
        updateSettingsDisplay();
    });
});

// Implement logic for rainbow checkbox.
let rainbowCheckbox = document.querySelector("#rainbow");
rainbowCheckbox.addEventListener("change", ()=> {
    let rgbVisual = document.querySelector(".rgb-visual");
    rainbowMode = rainbowCheckbox.checked;
    //rgbVisual.classList.toggle("rainbow");
    rgbVisual.classList.toggle("rgb-visual-animated");

    updateSettingsDisplay();
});

// Implement logic for blend checkbox.
let blendCheckbox = document.querySelector("#blend");
blendCheckbox.addEventListener("change", ()=> {
    blendMode = blendCheckbox.checked;
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

    redValueSlider.value = toolSettings.red;
    greenValueSlider.value = toolSettings.green;
    blueValueSlider.value = toolSettings.blue;
    strengthValueSlider.value = toolSettings.strength;
    toolDisplay.textContent = `Tool: ${tools[toolIndex]}`;
    

    rgbText.textContent = `RGB: (${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue})`;
    strengthText.textContent = `Strength: ${parseInt((toolSettings.strength) * 100)}%`;
    
    rgbVisual.style.backgroundColor = `rgba(${toolSettings.red}, ${toolSettings.green}, ${toolSettings.blue}, ${toolSettings.strength})`;

    canvasSizeText.textContent = `Canvas: ${canvasSize} x ${canvasSize}`;
}

// Implement download button.
let downloadButton = document.querySelector("#save-button");
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