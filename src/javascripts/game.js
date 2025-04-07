const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
const pacmanFrames = document.getElementById("animations");
const ghostFrames = document.getElementById("ghosts");
const chompSound = new Audio("src/sounds/chomp.mp3");

let createRect = (x, y, width, height, color) => {
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, width, height);
};

let fps = 30;
let oneBlockSize = 20;
let wallColor = "#342DCA";
let wallSpaceWidth = oneBlockSize / 1.5;
let wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
let wallInnerColor = "black";
let foodColor = "#FEB897";
let score = 0;
let ghosts = [];
let ghostCount = 4;
let lives = 3;
let foodCount = 0;
let gameStarted = false;
let gameInterval;

let startSound;

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;

const startBtn = document.querySelector('.start-btn');
    const screenWrapper = document.querySelector('.screen-wrapper');

    startBtn.addEventListener('click', () => {
        screenWrapper.classList.add('show-game');
        startCountdown();
});

window.onload = () => {
    startSound = new Audio("src/sounds/start.wav");
    startSound.loop = true; 
    startSound.play();

    startBtn.style.display = "inline-block"; 
};

if (startSound) {
    startSound.pause();
    startSound.currentTime = 0;
}

function startCountdown() {
    const countdownEl = document.createElement("div");
    countdownEl.id = "countdown";
    countdownEl.style.position = "absolute";
    countdownEl.style.top = "50%";
    countdownEl.style.left = "50%";
    countdownEl.style.transform = "translate(-50%, -50%)";
    countdownEl.style.font = "40px Emulogic";
    countdownEl.style.color = "white";
    countdownEl.style.zIndex = "1000";
    document.body.appendChild(countdownEl);

    let count = 3;
    countdownEl.innerText = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.innerText = count;
        } else if (count === 0) {
            countdownEl.innerText = "GO!";
        } else {
            clearInterval(countdownInterval);
            document.body.removeChild(countdownEl);
            if (startSound) {
                startSound.pause();
                startSound.currentTime = 0;
            }
            startGame();
        }
    }, 1000);
}

let ghostLocations = [
    {x: 0, y: 0},
    {x: 176, y: 0},
    {x: 0, y: 121},
    {x: 176, y: 121},
];

let map = [
    [1,1,1,1,1 ,1,1,1,1,1 , 1,1,1,1,1, 1,1,1,1,1, 1],
    [1,2,2,2,2 ,2,2,2,2,2 , 1,2,2,2,2, 2,2,2,2,2, 1],
    [1,2,1,1,1 ,2,1,1,1,2 , 1,2,1,1,1, 2,1,1,1,2, 1],
    [1,2,1,1,1 ,2,1,1,1,2 , 1,2,1,1,1, 2,1,1,1,2, 1],
    [1,2,2,2,2 ,2,2,2,2,2 , 2,2,2,2,2, 2,2,2,2,2, 1],
    [1,2,1,1,1 ,2,1,2,1,1 , 1,1,1,2,1, 2,1,1,1,2, 1],
    [1,2,2,2,2 ,2,1,2,2,2 , 1,2,2,2,1, 2,2,2,2,2, 1],
    [1,1,1,1,1 ,2,1,1,1,2 , 1,2,1,1,1, 2,1,1,1,1, 1],
    [0,0,0,0,1 ,2,1,2,2,2 , 2,2,2,2,1, 2,1,0,0,0, 0],
    [1,1,1,1,1 ,2,1,2,1,1 , 2,1,1,2,1, 2,1,1,1,1, 1],
    [1,2,2,2,2 ,2,2,2,1,2 , 2,2,1,2,2, 2,2,2,2,2, 1],
    [1,1,1,1,1 ,2,1,2,1,2 , 2,2,1,2,1, 2,1,1,1,1, 1],
    [0,0,0,0,1 ,2,1,2,1,1 , 1,1,1,2,1, 2,1,0,0,0, 0],
    [0,0,0,0,1 ,2,1,2,2,2 , 2,2,2,2,1, 2,1,0,0,0, 0],
    [1,1,1,1,1 ,2,2,2,1,1 , 1,1,1,2,2, 2,1,1,1,1, 1],
    [1,2,2,2,1 ,2,2,2,2,2 , 1,2,2,2,2, 2,2,2,2,2, 1],
    [1,2,1,1,1 ,2,1,1,1,2 , 1,2,1,1,1, 2,1,1,1,2, 1],
    [1,2,2,2,1 ,2,2,2,2,2 , 2,2,2,2,2, 2,1,2,2,2, 1],
    [1,1,2,2,1 ,2,1,2,1,1 , 1,1,1,2,1, 2,1,2,2,1, 1],
    [1,2,2,2,2 ,2,1,2,2,2 , 1,2,2,2,1, 2,2,2,2,2, 1],
    [1,2,1,1,1 ,1,1,1,1,2 , 1,2,1,1,1, 1,1,1,1,2, 1],
    [1,2,2,2,2 ,2,2,2,2,2 , 2,2,2,2,2, 2,2,2,2,2, 1],
    [1,1,1,1,1 ,1,1,1,1,1 , 1,1,1,1,1, 1,1,1,1,1, 1],
];

for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[0].length; j++) {
        if (map[i][j] == 2) {
            foodCount++;
        }
    }
}

let randomTargetsForGhosts = [
    {x: 1 * oneBlockSize, y: 1 * oneBlockSize},
    {x: 1 * oneBlockSize, y: (map.length - 2) * oneBlockSize},
    {x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize},
    {
        x: (map[0].length - 2) * oneBlockSize, 
        y: (map.length - 2) * oneBlockSize,
    },
];

let gameLoop = () => {
    draw();
    update();
};

let update = () => {
    //todo
    pacman.moveProcess();
    pacman.eat();
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].moveProcess();
    };

    if (pacman.checkGhostCollision()) {
        console.log("hit");
        restartGame();
    }

    if (score >= foodCount) {
        drawWin();
        clearInterval(gameInterval);
    }
};

let restartGame = () => {
    createNewPacman(); 
    createGhosts();
    lives--;
    if (lives == 0) {
        gameOver();
    }
};

let gameOver = () => {
    drawGameOver();
    clearInterval(gameInterval);
    showRestartButton();
} 

let drawGameOver = () => {
    canvasContext.font = "20px Emulogic";
    canvasContext.fillStyle = "White";
    canvasContext.fillText("Pac-Man foi de base!", 17, 20);
}

let drawWin = () => {
    canvasContext.font = "20px Emulogic";
    canvasContext.fillStyle = "White";
    canvasContext.fillText("Deu um pac no sistema", 0, 20);
    canvasContext.fillText("e ganhou!", 120, 45);
    showRestartButton();
}

let drawLives = () => {
    canvasContext.font = "15px Emulogic";
    canvasContext.fillStyle = "White";
    canvasContext.fillText(
        "Vidas: ",
        240, 
        oneBlockSize * (map.length + 1) + 10
    );
    for (let i = 0; i < lives; i++) {
        canvasContext.drawImage(
            pacmanFrames,
            2 * oneBlockSize,
            0,
            oneBlockSize, oneBlockSize, 340 + i * oneBlockSize,
            oneBlockSize * map.length + 12,
            oneBlockSize,
            oneBlockSize
        );
    }
};

let drawFoods = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 2) {
                createRect( 
                    j * oneBlockSize + oneBlockSize / 3, 
                    i * oneBlockSize + oneBlockSize / 3,
                    oneBlockSize / 3,
                    oneBlockSize / 3,
                    foodColor
                );
            }
        }
    }
};

let drawScore = () => {
    canvasContext.font = "15px Emulogic";
    canvasContext.fillStyle = "white";
    canvasContext.fillText(
        "Pontuacao: " + score,
        0,
        oneBlockSize * (map.length + 1) + 10
    )
};

let drawGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw();
    }
};

let draw = () => {
    createRect(0, 0, canvas.width, canvas.height, "black")
    //todo
    drawWalls();
    drawFoods();
    pacman.draw();
    drawScore();
    drawGhosts();
    drawLives();
};

let drawWalls = () => {
    for(let i = 0; i < map.length; i++) {
        for(let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 1) { // then it is a wall
                createRect(j * oneBlockSize, i * oneBlockSize, oneBlockSize, oneBlockSize, wallColor);

                if (j > 0 && map[i][j - 1] == 1) {
                    createRect(j * oneBlockSize, i * oneBlockSize + wallOffset, wallSpaceWidth + wallOffset, wallSpaceWidth, wallInnerColor);
                }

                if (j < map[0].length - 1 && map[i][j + 1] == 1) {
                    createRect(j * oneBlockSize + wallOffset, i * oneBlockSize + wallOffset, wallSpaceWidth + wallOffset, wallSpaceWidth, wallInnerColor);
                }

                if (i > 0 && map[i - 1][j] == 1) {
                    createRect(j * oneBlockSize + wallOffset, i * oneBlockSize, wallSpaceWidth, wallSpaceWidth + wallOffset, wallInnerColor);
                }

                if (i < map.length - 1 && map[i + 1][j] == 1) {
                    createRect(j * oneBlockSize + wallOffset, i * oneBlockSize + wallOffset, wallSpaceWidth, wallSpaceWidth + wallOffset, wallInnerColor);
                }
            }
        }
    }
};

let createNewPacman = () => {
    pacman = new Pacman(
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize / 5
    );
};

let createGhosts = () => {
    ghosts = [];
    for (let i = 0; i < ghostCount; i++) {
        let newGhost = new Ghost(
            9 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            10 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            pacman.speed / 2,
            ghostLocations[i % 4].x,
            ghostLocations[i % 4].y,
            124,
            116,
            6 + i
        );
        ghosts.push(newGhost);
    }
};

window.addEventListener("keydown", (event) => {
    let k = event.keyCode

    setTimeout(() => {
        if(k == 37 || k == 65) { // left
            pacman.nextDirection = DIRECTION_LEFT
        } else if (k == 38 || k == 87) { // up
            pacman.nextDirection = DIRECTION_UP
        } else if (k == 39 || k == 68) { // right
            pacman.nextDirection = DIRECTION_RIGHT
        } else if (k == 40 || k == 83) { // bottom
            pacman.nextDirection = DIRECTION_BOTTOM
        }
    }, 1);
});

function movePacman(direction) {
    switch (direction) {
        case 'up':
            pacman.nextDirection = DIRECTION_UP;
            break;
        case 'down':
            pacman.nextDirection = DIRECTION_BOTTOM;
            break;
        case 'left':
            pacman.nextDirection = DIRECTION_LEFT;
            break;
        case 'right':
            pacman.nextDirection = DIRECTION_RIGHT;
            break;
        default:
            console.warn("Direção inválida:", direction);
    }
}

function showRestartButton() {
    document.getElementById('restart-container').style.display = 'block';
}
  
  document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload(); 
});
  
function startGame() {
    createNewPacman();
    createGhosts();
    gameStarted = true;
    gameInterval = setInterval(gameLoop, 1000 / fps);
}
