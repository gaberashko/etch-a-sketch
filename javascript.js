const DEFAULT_GRID_SIZE = 4;
const PENCIL_STRENGTH = .10;


let container = document.querySelector(".container");
changeGridSize(DEFAULT_GRID_SIZE);

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomizeColor(element) {
    element.style.backgroundColor = `rgb(${getRandomInteger(0, 255)}, ${getRandomInteger(0, 255)}
    , ${getRandomInteger(0, 255)})`;
}

function changeGridSize(size) {
    let oldSquares = document.querySelector(".set");
    // Create the new squares and append to the container.
    for (let i = 0; i < (size**2); ++i) {
        let square = document.createElement("div");
        square.classList.add("square");
        square.classList.toggle("new");
        square.addEventListener("mouseenter", (event) => {
            if (event.buttons === 1) { square.style.opacity =
                parseFloat(getComputedStyle(square).opacity) + PENCIL_STRENGTH;
                randomizeColor(square);
            }
        });
        square.addEventListener("mousedown", () => {
            square.style.opacity = parseFloat(getComputedStyle(square).opacity)
            + PENCIL_STRENGTH;
            randomizeColor(square);
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
        
}

function getSize() {
    let size;
    do {
        size = Number(prompt("Please number of boxes per side:")); 
    } while (isNaN(size) || size < 1 || size > 100)
    return size;
}

let gridButton = document.querySelector("#size-button");
gridButton.addEventListener("click", () => {
    let size = getSize();
    changeGridSize(size);});