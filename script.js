
/* =========================================================
   🏝️ ISLAND SURVIVAL
   JavaScript
   👨‍💻 ULUG'BEK.R
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 1800;

let playerName = "O'yinchi";

let gameRunning = false;
let paused = false;

let soundOn = true;
let musicOn = true;

let day = 1;
let gameMinutes = 8 * 60;
let survivalDays = 1;

let lastTime = 0;
let autosaveTimer = 0;

let camera = {
    x: 0,
    y: 0
};

const keys = {};

let audioContext = null;


/* =========================================================
   PLAYER
========================================================= */

const player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,

    width: 34,
    height: 42,

    speed: 210,

    health: 100,
    hunger: 100,
    thirst: 100,

    direction: "down",

    moving: false
};


/* =========================================================
    INVENTORY
========================================================= */

const inventory = {
    wood: 0,
    stone: 0,
    food: 0,
    water: 0,

    axe: 0,
    pickaxe: 0
};


/* =========================================================
    WORLD OBJECTS
========================================================= */

let trees = [];
let rocks = [];
let fruits = [];
let waterSources = [];
let animals = [];
let enemies = [];

let campfire = null;
let shelter = null;


/* =========================================================
    WORLD GENERATION
========================================================= */

function generateWorld() {

    trees = [];
    rocks = [];
    fruits = [];
    waterSources = [];
    animals = [];
    enemies = [];

    /*
       Daraxtlar
    */

    for (let i = 0; i < 95; i++) {

        trees.push({
            x: random(130, WORLD_WIDTH - 130),
            y: random(130, WORLD_HEIGHT - 130),
            size: random(25, 42),
            alive: true
        });

    }


    /*
       Toshlar
    */

    for (let i = 0; i < 65; i++) {

        rocks.push({
            x: random(120, WORLD_WIDTH - 120),
            y: random(120, WORLD_HEIGHT - 120),
            size: random(18, 30),
            alive: true
        });

    }


    /*
       Mevalar
    */

    for (let i = 0; i < 45; i++) {

        fruits.push({
            x: random(100, WORLD_WIDTH - 100),
            y: random(100, WORLD_HEIGHT - 100),
            alive: true
        });

    }


    /*
       Suv manbalari
    */

    for (let i = 0; i < 8; i++) {

        waterSources.push({
            x: random(150, WORLD_WIDTH - 150),
            y: random(150, WORLD_HEIGHT - 150),
            radius: random(50, 90)
        });

    }


    /*
       Hayvonlar
    */

    for (let i = 0; i < 12; i++) {

        animals.push({
            x: random(150, WORLD_WIDTH - 150),
            y: random(150, WORLD_HEIGHT - 150),

            speed: random(25, 55),

            direction: random(
                0,
                Math.PI * 2
            ),

            changeTimer: random(1, 4),

            alive: true
        });

    }

}


/* =========================================================
   UTILITY
========================================================= */

function random(min, max) {

    return Math.random() *
        (max - min) +
        min;

}


function distance(x1, y1, x2, y2) {

    return Math.sqrt(
        Math.pow(x2 - x1, 2) +
        Math.pow(y2 - y1, 2)
    );

}


/* =========================================================
   AUDIO
========================================================= */

function playSound(type = "click") {

    if (!soundOn) return;

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(
            audioContext.destination
        );

        let frequency = 400;

        if (type === "collect") {
            frequency = 620;
        }

        if (type === "build") {
            frequency = 520;
        }

        if (type === "hit") {
            frequency = 150;
        }

        if (type === "water") {
            frequency = 750;
        }

        if (type === "win") {
            frequency = 900;
        }

        oscillator.frequency.value =
            frequency;

        oscillator.type = "sine";

        gain.gain.setValueAtTime(
            0.001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.12,
            audioContext.currentTime + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.18
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.2
        );

    } catch (error) {

        console.log(error);

    }

}


/* =========================================================
   MESSAGE
========================================================= */

let messageTimeout = null;

function showMessage(text) {

    const element =
        document.getElementById(
            "gameMessage"
        );

    element.textContent = text;

    element.classList.add("show");

    clearTimeout(messageTimeout);

    messageTimeout = setTimeout(() => {

        element.classList.remove("show");

    }, 2200);

}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    const input =
        document.getElementById(
            "playerName"
        );

    playerName =
        input.value.trim();

    if (!playerName) {

        showMessage(
            "👤 Avval ismingizni kiriting!"
        );

        input.focus();

        return;

    }

    gameRunning = true;
    paused = false;

    day = 1;

    gameMinutes = 8 * 60;

    survivalDays = 1;

    player.x =
        WORLD_WIDTH / 2;

    player.y =
        WORLD_HEIGHT / 2;

    player.health = 100;
    player.hunger = 100;
    player.thirst = 100;

    inventory.wood = 0;
    inventory.stone = 0;
    inventory.food = 0;
    inventory.water = 0;
    inventory.axe = 0;
    inventory.pickaxe = 0;

    campfire = null;
    shelter = null;

    generateWorld();

    document.getElementById(
        "playerDisplay"
    ).textContent =
        playerName;

    hideAllScreens();

    updateUI();

    saveGame();

    playSound("click");

    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    if (!gameRunning) return;

    if (!lastTime) {

        lastTime = timestamp;

    }

    const delta =
        Math.min(
            (timestamp - lastTime) / 1000,
            0.05
        );

    lastTime = timestamp;

    if (!paused) {

        update(delta);

        draw();

    }

    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   UPDATE
========================================================= */

function update(delta) {

    updatePlayer(delta);

    updateNeeds(delta);

    updateTime(delta);

    updateAnimals(delta);

    updateEnemies(delta);

    updateCamera();

    autosaveTimer += delta;

    if (autosaveTimer >= 10) {

        saveGame();

        autosaveTimer = 0;

    }

    if (
        player.health <= 0
    ) {

        gameOver();

    }

}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(delta) {

    let dx = 0;
    let dy = 0;

    if (
        keys["w"] ||
        keys["ArrowUp"]
    ) {

        dy -= 1;

        player.direction =
            "up";

    }

    if (
        keys["s"] ||
        keys["ArrowDown"]
    ) {

        dy += 1;

        player.direction =
            "down";

    }

    if (
        keys["a"] ||
        keys["ArrowLeft"]
    ) {

        dx -= 1;

        player.direction =
            "left";

    }

    if (
        keys["d"] ||
        keys["ArrowRight"]
    ) {

        dx += 1;

        player.direction =
            "right";

    }

    player.moving =
        dx !== 0 || dy !== 0;

    if (dx !== 0 && dy !== 0) {

        dx *= 0.707;

        dy *= 0.707;

    }

    player.x +=
        dx *
        player.speed *
        delta;

    player.y +=
        dy *
        player.speed *
        delta;


    /*
       World chegarasi
    */

    player.x =
        Math.max(
            60,
            Math.min(
                WORLD_WIDTH - 60,
                player.x
            )
        );

    player.y =
        Math.max(
            60,
            Math.min(
                WORLD_HEIGHT - 60,
                player.y
            )
        );

}


/* =========================================================
   HUNGER / THIRST
========================================================= */

function updateNeeds(delta) {

    player.hunger -=
        0.45 * delta;

    player.thirst -=
        0.7 * delta;

    if (
        player.hunger <= 0
    ) {

        player.hunger = 0;

        player.health -=
            1.2 * delta;

    }

    if (
        player.thirst <= 0
    ) {

        player.thirst = 0;

        player.health -=
            1.8 * delta;

    }

    updateUI();

}


/* =========================================================
   DAY / NIGHT
========================================================= */

function updateTime(delta) {

    /*
       1 real second =
       2 game minutes
    */

    gameMinutes +=
        delta * 2;

    if (
        gameMinutes >= 24 * 60
    ) {

        gameMinutes =
            0;

        day++;

        survivalDays = day;

        showMessage(
            `🌅 ${day}-kun boshlandi!`
        );

        saveGame();

    }

    updateDayNight();

}


function updateDayNight() {

    const hour =
        Math.floor(
            gameMinutes / 60
        );

    const minute =
        Math.floor(
            gameMinutes % 60
        );

    document.getElementById(
        "clockText"
    ).textContent =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    document.getElementById(
        "dayText"
    ).textContent =
        `DAY ${day}`;

    const night =
        hour >= 19 ||
        hour < 6;

    document.getElementById(
        "timeIcon"
    ).textContent =
        night ? "🌙" : "☀️";

    if (night) {

        canvas.style.filter =
            "brightness(0.55)";

        spawnNightEnemies();

    } else {

        canvas.style.filter =
            "brightness(1)";

    }

}


/* =========================================================
   ANIMALS
========================================================= */

function updateAnimals(delta) {

    animals.forEach(animal => {

        if (!animal.alive) return;

        animal.changeTimer -=
            delta;

        if (
            animal.changeTimer <= 0
        ) {

            animal.direction =
                random(
                    0,
                    Math.PI * 2
                );

            animal.changeTimer =
                random(1, 4);

        }

        animal.x +=
            Math.cos(
                animal.direction
            ) *
            animal.speed *
            delta;

        animal.y +=
            Math.sin(
                animal.direction
            ) *
            animal.speed *
            delta;

        animal.x =
            Math.max(
                70,
                Math.min(
                    WORLD_WIDTH - 70,
                    animal.x
                )
            );

        animal.y =
            Math.max(
                70,
                Math.min(
                    WORLD_HEIGHT - 70,
                    animal.y
                )
            );

        /*
           Playerga yaqin hayvon
        */

        if (
            distance(
                player.x,
                player.y,
                animal.x,
                animal.y
            ) < 45
        ) {

            if (
                inventory.food <
                10
            ) {

                animal.alive =
                    false;

                inventory.food += 2;

                showMessage(
                    "🍎 Ovqat topdingiz!"
                );

                playSound("collect");

            }

        }

    });

}


/* =========================================================
   NIGHT ENEMIES
========================================================= */

function spawnNightEnemies() {

    if (enemies.length >= 8) {
        return;
    }

    if (
        Math.random() >
        0.008
    ) {
        return;
    }

    const side =
        Math.floor(
            Math.random() * 4
        );

    let x;
    let y;

    if (side === 0) {

        x = 80;

        y =
            random(
                80,
                WORLD_HEIGHT - 80
            );

    } else if (side === 1) {

        x =
            WORLD_WIDTH - 80;

        y =
            random(
                80,
                WORLD_HEIGHT - 80
            );

    } else if (side === 2) {

        x =
            random(
                80,
                WORLD_WIDTH - 80
            );

        y = 80;

    } else {

        x =
            random(
                80,
                WORLD_WIDTH - 80
            );

        y =
            WORLD_HEIGHT - 80;

    }

    enemies.push({

        x,
        y,

        speed:
            45 + day * 2,

        attackTimer: 0

    });

}


function updateEnemies(delta) {

    enemies.forEach(
        enemy => {

            const dx =
                player.x -
                enemy.x;

            const dy =
                player.y -
                enemy.y;

            const dist =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (dist > 1) {

                enemy.x +=
                    dx / dist *
                    enemy.speed *
                    delta;

                enemy.y +=
                    dy / dist *
                    enemy.speed *
                    delta;

            }

            enemy.attackTimer -=
                delta;

            if (
                dist < 42 &&
                enemy.attackTimer <= 0
            ) {

                player.health -= 8;

                enemy.attackTimer = 1;

                playSound("hit");

                showMessage(
                    "🐺 Dushman hujum qildi!"
                );

                updateUI();

            }

        }
    );

}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    camera.x =
        player.x -
        canvas.width / 2;

    camera.y =
        player.y -
        canvas.height / 2;

    camera.x =
        Math.max(
            0,
            Math.min(
                WORLD_WIDTH -
                canvas.width,
                camera.x
            )
        );

    camera.y =
        Math.max(
            0,
            Math.min(
                WORLD_HEIGHT -
                canvas.height,
                camera.y
            )
        );

}


/* =========================================================
   DRAW WORLD
========================================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );

    drawOcean();

    drawIsland();

    drawWater();

    drawResources();

    drawCampfire();

    drawShelter();

    drawAnimals();

    drawEnemies();

    drawPlayer();

    ctx.restore();

}


/* =========================================================
   OCEAN
========================================================= */

function drawOcean() {

    ctx.fillStyle =
        "#087f9f";

    ctx.fillRect(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );


    /*
       Ocean waves
    */

    ctx.strokeStyle =
        "rgba(255,255,255,0.12)";

    ctx.lineWidth = 2;

    for (
        let x = 0;
        x < WORLD_WIDTH;
        x += 80
    ) {

        for (
            let y = 0;
            y < WORLD_HEIGHT;
            y += 80
        ) {

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                18,
                0,
                Math.PI
            );

            ctx.stroke();

        }

    }

}


/* =========================================================
   ISLAND
========================================================= */

function drawIsland() {

    ctx.save();

    ctx.fillStyle =
        "#cda84a";

    ctx.beginPath();

    ctx.ellipse(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH * 0.42,
        WORLD_HEIGHT * 0.39,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#55a947";

    ctx.beginPath();

    ctx.ellipse(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH * 0.37,
        WORLD_HEIGHT * 0.34,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

}


/* =========================================================
   WATER SOURCES
========================================================= */

function drawWater() {

    waterSources.forEach(
        water => {

            ctx.fillStyle =
                "#25b9e6";

            ctx.beginPath();

            ctx.arc(
                water.x,
                water.y,
                water.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#a7f2ff";

            ctx.lineWidth = 3;

            ctx.stroke();

        }
    );

}


/* =========================================================
   RESOURCES
========================================================= */

function drawResources() {

    trees.forEach(
        tree => {

            if (!tree.alive) return;

            ctx.font =
                `${tree.size * 2}px Arial`;

            ctx.textAlign =
                "center";

            ctx.textBaseline =
                "middle";

            ctx.fillText(
                "🌲",
                tree.x,
                tree.y
            );

        }
    );


    rocks.forEach(
        rock => {

            if (!rock.alive) return;

            ctx.font =
                `${rock.size * 1.5}px Arial`;

            ctx.textAlign =
                "center";

            ctx.textBaseline =
                "middle";

            ctx.fillText(
                "🪨",
                rock.x,
                rock.y
            );

        }
    );


    fruits.forEach(
        fruit => {

            if (!fruit.alive) return;

            ctx.font = "25px Arial";

            ctx.fillText(
                "🍎",
                fruit.x,
                fruit.y
            );

        }
    );

}


/* =========================================================
   CAMPFIRE
========================================================= */

function drawCampfire() {

    if (!campfire) return;

    ctx.font = "48px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "🔥",
        campfire.x,
        campfire.y
    );

}


/* =========================================================
   SHELTER
========================================================= */

function drawShelter() {

    if (!shelter) return;

    ctx.font = "70px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "🏠",
        shelter.x,
        shelter.y
    );

}


/* =========================================================
   ANIMALS DRAW
========================================================= */

function drawAnimals() {

    animals.forEach(
        animal => {

            if (!animal.alive) return;

            ctx.font =
                "35px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                "🐇",
                animal.x,
                animal.y
            );

        }
    );

}


/* =========================================================
   ENEMIES DRAW
========================================================= */

function drawEnemies() {

    enemies.forEach(
        enemy => {

            ctx.font =
                "40px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                "🐺",
                enemy.x,
                enemy.y
            );

        }
    );

}


/* =========================================================
   PLAYER DRAW
========================================================= */

function drawPlayer() {

    ctx.save();

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    /*
       Shadow
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y + 20,
        18,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
       Player
    */

    ctx.font = "42px Arial";

    ctx.fillText(
        "🧍",
        player.x,
        player.y
    );


    /*
       Name
    */

    ctx.font =
        "bold 13px Arial";

    ctx.fillStyle =
        "white";

    ctx.fillText(
        playerName,
        player.x,
        player.y - 32
    );

    ctx.restore();

}


/* =========================================================
   COLLECT RESOURCE
========================================================= */

function collectResource() {

    let collected = false;


    /*
       TREE
    */

    for (
        const tree of trees
    ) {

        if (!tree.alive) continue;

        const dist =
            distance(
                player.x,
                player.y,
                tree.x,
                tree.y
            );

        if (dist < 75) {

            const amount =
                inventory.axe > 0
                    ? 4
                    : 2;

            inventory.wood +=
                amount;

            tree.alive = false;

            collected = true;

            showMessage(
                `🪵 +${amount} yog'och`
            );

            playSound("collect");

            break;

        }

    }


    if (collected) {

        updateUI();

        return;

    }


    /*
       ROCK
    */

    for (
        const rock of rocks
    ) {

        if (!rock.alive) continue;

        const dist =
            distance(
                player.x,
                player.y,
                rock.x,
                rock.y
            );

        if (dist < 65) {

            const amount =
                inventory.pickaxe > 0
                    ? 4
                    : 2;

            inventory.stone +=
                amount;

            rock.alive = false;

            collected = true;

            showMessage(
                `🪨 +${amount} tosh`
            );

            playSound("collect");

            break;

        }

    }


    if (collected) {

        updateUI();

        return;

    }


    /*
       FRUIT
    */

    for (
        const fruit of fruits
    ) {

        if (!fruit.alive) continue;

        const dist =
            distance(
                player.x,
                player.y,
                fruit.x,
                fruit.y
            );

        if (dist < 60) {

            inventory.food += 1;

            fruit.alive = false;

            collected = true;

            showMessage(
                "🍎 +1 ovqat"
            );

            playSound("collect");

            break;

        }

    }


    if (collected) {

        updateUI();

        return;

    }


    /*
       WATER
    */

    for (
        const water of waterSources
    ) {

        const dist =
            distance(
                player.x,
                player.y,
                water.x,
                water.y
            );

        if (
            dist <
            water.radius + 30
        ) {

            inventory.water += 1;

            collected = true;

            showMessage(
                "💧 +1 suv"
            );

            playSound("water");

            break;

        }

    }


    if (!collected) {

        showMessage(
            "❌ Yaqinda yig'adigan resurs yo'q"
        );

    }

    updateUI();

}


/* =========================================================
   USE FOOD
========================================================= */

function eatFood() {

    if (
        inventory.food <= 0
    ) {

        showMessage(
            "🍎 Ovqat yo'q!"
        );

        return;

    }

    inventory.food--;

    player.hunger =
        Math.min(
            100,
            player.hunger + 25
        );

    showMessage(
        "🍎 Ovqat yedingiz! +25 Hunger"
    );

    playSound("collect");

    updateUI();

}


/* =========================================================
   DRINK WATER
========================================================= */

function drinkWater() {

    if (
        inventory.water <= 0
    ) {

        showMessage(
            "💧 Suv yo'q!"
        );

        return;

    }

    inventory.water--;

    player.thirst =
        Math.min(
            100,
            player.thirst + 35
        );

    showMessage(
        "💧 Suv ichdingiz! +35 Thirst"
    );

    playSound("water");

    updateUI();

}


/* =========================================================
   BUILD CAMPFIRE
========================================================= */

function buildCampfire() {

    if (
        inventory.wood < 5 ||
        inventory.stone < 2
    ) {

        showMessage(
            "🔥 5 🪵 + 2 🪨 kerak!"
        );

        return;

    }

    inventory.wood -= 5;

    inventory.stone -= 2;

    campfire = {

        x: player.x,

        y: player.y

    };

    showMessage(
        "🔥 Gulxan qurildi!"
    );

    playSound("build");

    updateUI();

}


/* =========================================================
   BUILD SHELTER
========================================================= */

function buildShelter() {

    if (
        shelter
    ) {

        showMessage(
            "🏠 Boshpana allaqachon qurilgan!"
        );

        return;

    }

    if (
        inventory.wood < 12 ||
        inventory.stone < 6
    ) {

        showMessage(
            "🏠 12 🪵 + 6 🪨 kerak!"
        );

        return;

    }

    inventory.wood -= 12;

    inventory.stone -= 6;

    shelter = {

        x: player.x,

        y: player.y

    };

    showMessage(
        "🏠 Boshpana qurildi!"
    );

    playSound("build");

    updateUI();

}


/* =========================================================
   CRAFT WINDOW
========================================================= */

function openCraft() {

    document
        .getElementById(
            "craftWindow"
        )
        .classList.remove(
            "hidden"
        );

}


function closeCraft() {

    document
        .getElementById(
            "craftWindow"
        )
        .classList.add(
            "hidden"
        );

}


/* =========================================================
   CRAFT AXE
========================================================= */

function craftAxe() {

    if (
        inventory.wood < 5 ||
        inventory.stone < 2
    ) {

        showMessage(
            "🪓 5 🪵 + 2 🪨 kerak!"
        );

        return;

    }

    inventory.wood -= 5;

    inventory.stone -= 2;

    inventory.axe++;

    showMessage(
        "🪓 Axe yaratildi!"
    );

    playSound("build");

    updateUI();

}


/* =========================================================
   CRAFT PICKAXE
========================================================= */

function craftPickaxe() {

    if (
        inventory.wood < 4 ||
        inventory.stone < 5
    ) {

        showMessage(
            "⛏️ 4 🪵 + 5 🪨 kerak!"
        );

        return;

    }

    inventory.wood -= 4;

    inventory.stone -= 5;

    inventory.pickaxe++;

    showMessage(
        "⛏️ Pickaxe yaratildi!"
    );

    playSound("build");

    updateUI();

}


/* =========================================================
   UI UPDATE
========================================================= */

function updateUI() {

    /*
       Health
    */

    const health =
        Math.max(
            0,
            Math.min(
                100,
                player.health
            )
        );

    const hunger =
        Math.max(
            0,
            Math.min(
                100,
                player.hunger
            )
        );

    const thirst =
        Math.max(
            0,
            Math.min(
                100,
                player.thirst
            )
        );


    document.getElementById(
        "healthBar"
    ).style.width =
        health + "%";

    document.getElementById(
        "hungerBar"
    ).style.width =
        hunger + "%";

    document.getElementById(
        "thirstBar"
    ).style.width =
        thirst + "%";


    document.getElementById(
        "healthText"
    ).textContent =
        Math.round(health);

    document.getElementById(
        "hungerText"
    ).textContent =
        Math.round(hunger);

    document.getElementById(
        "thirstText"
    ).textContent =
        Math.round(thirst);


    /*
       Inventory
    */

    document.getElementById(
        "woodCount"
    ).textContent =
        inventory.wood;

    document.getElementById(
        "stoneCount"
    ).textContent =
        inventory.stone;

    document.getElementById(
        "foodCount"
    ).textContent =
        inventory.food;

    document.getElementById(
        "waterCount"
    ).textContent =
        inventory.water;

    document.getElementById(
        "axeCount"
    ).textContent =
        inventory.axe;

    document.getElementById(
        "pickaxeCount"
    ).textContent =
        inventory.pickaxe;


    /*
       Days
    */

    document.getElementById(
        "survivalDays"
    ).textContent =
        survivalDays;

}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (!gameRunning) return;

    paused =
        !paused;

    const pauseScreen =
        document.getElementById(
            "pauseScreen"
        );

    if (paused) {

        pauseScreen.classList.remove(
            "hidden"
        );

        playSound("click");

    } else {

        pauseScreen.classList.add(
            "hidden"
        );

        playSound("click");

    }

}


/* =========================================================
   SAVE GAME
========================================================= */

function saveGame() {

    if (!playerName) return;

    const saveData = {

        playerName,

        player: {
            x: player.x,
            y: player.y,

            health: player.health,
            hunger: player.hunger,
            thirst: player.thirst
        },

        inventory,

        day,

        gameMinutes,

        survivalDays,

        campfire,

        shelter,

        trees,

        rocks,

        fruits,

        waterSources,

        animals,

        enemies

    };


    localStorage.setItem(
        "ULUGBEK_ISLAND_SURVIVAL",
        JSON.stringify(
            saveData
        )
    );

    showMessage(
        "💾 O'yin saqlandi!"
    );

}


/* =========================================================
   LOAD GAME
========================================================= */

function loadGame() {

    const data =
        localStorage.getItem(
            "ULUGBEK_ISLAND_SURVIVAL"
        );

    if (!data) {

        showMessage(
            "💾 Saqlangan o'yin topilmadi!"
        );

        return;

    }

    try {

        const save =
            JSON.parse(data);


        playerName =
            save.playerName ||
            "O'yinchi";


        player.x =
            save.player.x;

        player.y =
            save.player.y;

        player.health =
            save.player.health;

        player.hunger =
            save.player.hunger;

        player.thirst =
            save.player.thirst;


        inventory.wood =
            save.inventory.wood;

        inventory.stone =
            save.inventory.stone;

        inventory.food =
            save.inventory.food;

        inventory.water =
            save.inventory.water;

        inventory.axe =
            save.inventory.axe;

        inventory.pickaxe =
            save.inventory.pickaxe;


        day =
            save.day;

        gameMinutes =
            save.gameMinutes;

        survivalDays =
            save.survivalDays;


        campfire =
            save.campfire;

        shelter =
            save.shelter;


        trees =
            save.trees;

        rocks =
            save.rocks;

        fruits =
            save.fruits;

        waterSources =
            save.waterSources;

        animals =
            save.animals;

        enemies =
            save.enemies;


        gameRunning = true;

        paused = false;


        document.getElementById(
            "playerDisplay"
        ).textContent =
            playerName;


        hideAllScreens();

        updateUI();

        showMessage(
            "💾 O'yin yuklandi!"
        );

        requestAnimationFrame(
            gameLoop
        );

    } catch (error) {

        console.error(
            error
        );

        showMessage(
            "❌ Saqlangan o'yinni yuklab bo'lmadi!"
        );

    }

}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    gameRunning = false;

    paused = false;

    document.getElementById(
        "finalName"
    ).textContent =
        playerName;

    document.getElementById(
        "finalDays"
    ).textContent =
        survivalDays;

    document.getElementById(
        "finalWood"
    ).textContent =
        inventory.wood;

    document.getElementById(
        "finalStone"
    ).textContent =
        inventory.stone;

    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.remove(
            "hidden"
        );

    playSound("hit");

}


/* =========================================================
   RESTART
========================================================= */

function restartGame() {

    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.add(
            "hidden"
        );

    startGame();

}


/* =========================================================
   MAIN MENU
========================================================= */

function mainMenu() {

    gameRunning = false;

    paused = false;

    document
        .getElementById(
            "pauseScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "gameScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "startScreen"
        )
        .classList.remove(
            "hidden"
        );

}


/* =========================================================
   HIDE ALL SCREENS
========================================================= */

function hideAllScreens() {

    document
        .getElementById(
            "startScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "pauseScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "gameOverScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "gameScreen"
        )
        .classList.remove(
            "hidden"
        );

}


/* =========================================================
   KEYBOARD EVENTS
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key;

        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                " "
            ].includes(key)
        ) {

            event.preventDefault();

        }


        keys[key] = true;

        keys[key.toLowerCase()] =
            true;


        /*
           E = Collect
        */

        if (
            key.toLowerCase() === "e"
        ) {

            collectResource();

        }


        /*
           F = Food
        */

        if (
            key.toLowerCase() === "f"
        ) {

            eatFood();

        }


        /*
           R = Water
        */

        if (
            key.toLowerCase() === "r"
        ) {

            drinkWater();

        }


        /*
           C = Craft
        */

        if (
            key.toLowerCase() === "c"
        ) {

            openCraft();

        }


        /*
           ESC = Pause
        */

        if (
            key === "Escape"
        ) {

            togglePause();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[event.key] =
            false;

        keys[
            event.key.toLowerCase()
        ] = false;

    }
);


/* =========================================================
   BUTTON EVENTS
========================================================= */

document
    .getElementById(
        "startBtn"
    )
    .addEventListener(
        "click",
        startGame
    );


document
    .getElementById(
        "loadBtn"
    )
    .addEventListener(
        "click",
        loadGame
    );


document
    .getElementById(
        "pauseBtn"
    )
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById(
        "resumeBtn"
    )
    .addEventListener(
        "click",
        togglePause
    );


document
    .getElementById(
        "saveBtn"
    )
    .addEventListener(
        "click",
        saveGame
    );


document
    .getElementById(
        "menuBtn"
    )
    .addEventListener(
        "click",
        mainMenu
    );


document
    .getElementById(
        "restartBtn"
    )
    .addEventListener(
        "click",
        restartGame
    );


document
    .getElementById(
        "collectBtn"
    )
    .addEventListener(
        "click",
        collectResource
    );


document
    .getElementById(
        "buildFireBtn"
    )
    .addEventListener(
        "click",
        buildCampfire
    );


document
    .getElementById(
        "buildHouseBtn"
    )
    .addEventListener(
        "click",
        buildShelter
    );


document
    .getElementById(
        "craftBtn"
    )
    .addEventListener(
        "click",
        openCraft
    );


document
    .getElementById(
        "closeCraftBtn"
    )
    .addEventListener(
        "click",
        closeCraft
    );


document
    .getElementById(
        "craftAxeBtn"
    )
    .addEventListener(
        "click",
        craftAxe
    );


document
    .getElementById(
        "craftPickaxeBtn"
    )
    .addEventListener(
        "click",
        craftPickaxe
    );


/* =========================================================
   SOUND / MUSIC BUTTONS
========================================================= */

document
    .getElementById(
        "soundBtn"
    )
    .addEventListener(
        "click",
        () => {

            soundOn =
                !soundOn;

            document
                .getElementById(
                    "soundBtn"
                )
                .textContent =
                soundOn
                    ? "🔊"
                    : "🔇";

            if (soundOn) {

                playSound("click");

            }

        }
    );


document
    .getElementById(
        "musicBtn"
    )
    .addEventListener(
        "click",
        () => {

            musicOn =
                !musicOn;

            document
                .getElementById(
                    "musicBtn"
                )
                .textContent =
                musicOn
                    ? "🎵"
                    : "🔇";

        }
    );


/* =========================================================
   MOBILE CONTROLS
========================================================= */

document
    .querySelectorAll(
        ".mobile-controls button"
    )
    .forEach(button => {

        const key =
            button.dataset.key;


        button.addEventListener(
            "touchstart",
            event => {

                event.preventDefault();

                keys[key] = true;

            }
        );


        button.addEventListener(
            "touchend",
            event => {

                event.preventDefault();

                keys[key] = false;

            }
        );


        button.addEventListener(
            "mousedown",
            () => {

                keys[key] = true;

            }
        );


        button.addEventListener(
            "mouseup",
            () => {

                keys[key] = false;

            }
        );


        button.addEventListener(
            "mouseleave",
            () => {

                keys[key] = false;

            }
        );

    });


/* =========================================================
   TOUCH CANVAS
========================================================= */

canvas.addEventListener(
    "click",
    () => {

        if (!gameRunning) return;

        /*
           Canvasga bosganda yaqin
           resursni yig'ish
        */

        collectResource();

    }
);


/* =========================================================
   WINDOW RESIZE
========================================================= */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    /*
       Canvas o'lchami CSS orqali
       boshqariladi.
    */

    if (
        rect.width > 0 &&
        rect.height > 0
    ) {

        canvas.style.display =
            "block";

    }

}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================================================
   PREVENT CONTEXT MENU
========================================================= */

canvas.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

    }
);


/* =========================================================
   AUTO SAVE BEFORE CLOSE
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (gameRunning) {

            saveGame();

        }

    }
);


/* =========================================================
   LOAD SAVED NAME
========================================================= */

const savedPlayerName =
    localStorage.getItem(
        "ULUGBEK_ISLAND_PLAYER"
    );

if (savedPlayerName) {

    document.getElementById(
        "playerName"
    ).value =
        savedPlayerName;

}


document
    .getElementById(
        "playerName"
    )
    .addEventListener(
        "input",
        event => {

            localStorage.setItem(
                "ULUGBEK_ISLAND_PLAYER",
                event.target.value
            );

        }
    );


/* =========================================================
   INITIAL WORLD
========================================================= */

generateWorld();

updateUI();

console.log(
    "🏝️ Island Survival ishga tushdi!"
);

console.log(
    "👨‍💻 ULUG'BEK.R"
);

