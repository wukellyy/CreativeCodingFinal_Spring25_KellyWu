let openSansRegular;
let openSansBold;

let wordBarHeight;
let wordLength = 5;
let currentWord = "";
let wordLoaded = false;
let markedLetters = []; // Tracks which letters have been hit

let roundStartTime;
let roundDuration = 60 * 1000; // 60 seconds

let fallingLetters = [];
let letterFallSpeed = 2;
const MIN_FALL_SPEED = 1.5;
const MAX_FALL_SPEED = 8;
const BASE_SPAWN_INTERVAL = 1000; // 1 second
const MAX_SPAWN_RATE = 300; // 0.3 second
let spawnInterval = 1000;
let lastSpawnTime = 0;

let ball;
let ballSpeed = 10;
let isBallMoving = false;

let heartImage;
let heartsRemaining = 3;
let heartSize = 40;

let score = 0;
const MAX_WORD_LENGTH = 15;
const BASE_WORD_LENGTH = 5;

let clockImage;
let clocks = [];
const CLOCK_DROP_CHANCE = 0.07; // 7%
const CLOCK_TIME_BONUS = 10 * 1000; // 10 seconds

let gameState = "menu";
let lossReason = "";
let currentMode = "";
let modeButtons = [];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let fallingLettersMenu = [];
let lastMenuSpawnTime = 0;
const MENU_SPAWN_INTERVAL = 800;

let wordBank = [];

function preload() {
  openSansRegular = loadFont("assets/Open_Sans/static/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/Open_Sans/static/OpenSans-Bold.ttf");

  heartImage = loadImage("assets/heart.png");
  clockImage = loadImage("assets/clock.png");

  // Fallback word list in case Random Word API has a server error
  wordBank = loadStrings("assets/wordlist.txt");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  wordBarHeight = height - 150;
  ball = new Ball();

  // Mode buttons
  const labels = ["Normal", "Shrink", "Rotate", "Mirror"];
  let btnW = 200;
  let btnH = 50;
  for (let i = 0; i < labels.length; i++) {
    let x = width / 2 - btnW / 2;
    let y = height / 2 - 60 + i * 70;
    modeButtons.push(new MenuButton(labels[i], x, y, btnW, btnH));
  }
}

function draw() {
  background(251, 250, 240); // Cream

  if (gameState === "menu") {
    displayStartMenu();
    return;
  }

  // Show loading screen before word is ready
  if (!wordLoaded) {
    textAlign(CENTER, CENTER);
    textFont(openSansBold);
    textSize(32);
    fill(100);
    text("Loading...", width / 2, height / 2);
    return;
  }

  console.log(
    `Mode: ${currentMode}, Score: ${score}, Speed: ${letterFallSpeed}`
  );

  // Falling letters logic
  for (let i = fallingLetters.length - 1; i >= 0; i--) {
    fallingLetters[i].update();
    fallingLetters[i].display();

    // Remove letter if it goes off screen
    if (fallingLetters[i].isOffScreen()) {
      fallingLetters.splice(i, 1);
    }
  }

  // Clock item logic
  for (let i = clocks.length - 1; i >= 0; i--) {
    clocks[i].update();
    clocks[i].display();

    if (clocks[i].isOffScreen()) {
      clocks.splice(i, 1);
    } else if (ball.hit(clocks[i])) {
      roundStartTime += CLOCK_TIME_BONUS; // Add time
      clocks.splice(i, 1);
      ball.reset();
    }
  }

  // Dynamically adjust spawn rate based on fall speed
  spawnInterval = max(
    MAX_SPAWN_RATE,
    BASE_SPAWN_INTERVAL - (letterFallSpeed - 2) * 100
  );

  // Spawn new falling letters during round
  if (
    gameState === "playing" &&
    millis() - lastSpawnTime > spawnInterval &&
    wordLoaded
  ) {
    spawnFallingLetter();
    // Chance for clock to also drop
    if (random() < CLOCK_DROP_CHANCE) {
      spawnClock();
    }
    lastSpawnTime = millis();
  }

  // Draw aiming guide if not launched yet
  if (!isBallMoving) {
    stroke(0);
    strokeWeight(2);
    line(ball.pos.x, ball.pos.y, mouseX, mouseY);
  }

  // Ball logic
  ball.update();
  ball.display();

  // Check collision with letters
  for (let i = fallingLetters.length - 1; i >= 0; i--) {
    if (ball.hit(fallingLetters[i])) {
      const hitLetter = fallingLetters[i].letter;

      // Mark letter in prompted word if hit
      if (isBallMoving) {
        let correctHit = false;
        for (let j = 0; j < currentWord.length; j++) {
          if (currentWord[j] === hitLetter && !markedLetters[j]) {
            markedLetters[j] = true;
            correctHit = true;
            break; // Only mark one occurrence
          }
        }

        // Mark as hit and trigger feedback colors
        fallingLetters[i].hit = true;
        fallingLetters[i].hitColor = correctHit ? "correct" : "incorrect";
        fallingLetters[i].hitTimer = 100;
        ball.reset();

        if (correctHit) {
          letterFallSpeed = min(MAX_FALL_SPEED, letterFallSpeed * 1.2); // Increase speed on correct hit
        } else {
          heartsRemaining--;
          letterFallSpeed = max(MIN_FALL_SPEED, letterFallSpeed * 0.9); // Decrease speed on incorrect hit

          // Go back to start menu if out of lives
          if (heartsRemaining <= 0) {
            lossReason = "OUT OF LIVES";
            gameState = "menu";
            fallingLetters = [];
            clocks = [];
            return;
          }
        }
      }

      // If all letters are marked, go to next round
      if (markedLetters.every((item) => item === true)) {
        nextRound(true);
      }

      break;
    }
  }

  // Remove letters after their hit feedback expires
  for (let i = fallingLetters.length - 1; i >= 0; i--) {
    if (fallingLetters[i].hit && fallingLetters[i].hitTimer <= 0) {
      fallingLetters.splice(i, 1);
    }
  }

  displayTimer();
  displayPromptedWord(currentWord);
  displayHearts();
  displayScore();

  // Go back to start menu if out of time
  if (millis() - roundStartTime > roundDuration) {
    lossReason = "OUT OF TIME";
    gameState = "menu";
    fallingLetters = [];
    clocks = [];
  }
}

function displayStartMenu() {
  background(251, 250, 240); // Cream

  // Falling background letters
  for (let i = fallingLettersMenu.length - 1; i >= 0; i--) {
    fallingLettersMenu[i].update();
    fallingLettersMenu[i].display();

    if (fallingLettersMenu[i].isOffScreen()) {
      fallingLettersMenu.splice(i, 1);
    }
  }

  if (millis() - lastMenuSpawnTime > MENU_SPAWN_INTERVAL) {
    spawnMenuLetter();
    lastMenuSpawnTime = millis();
  }

  // Transparent overlay
  fill(0, 40);
  noStroke();
  rectMode(CORNER);
  rect(0, 0, width, height);

  // Menu box
  rectMode(CENTER);
  fill(255);
  stroke(0);
  strokeWeight(1.5);
  rect(width / 2, height / 2, 320, 440, 24);

  // Title
  noStroke();
  fill(0);
  textFont(openSansBold);
  textSize(28);
  textAlign(CENTER, TOP);
  text("Pick Game Mode", width / 2, height / 2 - 180);

  // Loss reason and score
  if (lossReason) {
    textFont(openSansBold);
    textSize(20);
    fill(200, 0, 0);
    text(lossReason, width / 2, height / 2 - 140);

    fill(0);
    textSize(18);
    text(`Final Score: ${score}`, width / 2, height / 2 - 115);
  }

  // Buttons
  modeButtons.forEach((btn) => btn.display());
}

function displayTimer() {
  // Calculate remaining time
  let timeLeft = max(0, roundDuration - (millis() - roundStartTime));
  let totalSeconds = floor(timeLeft / 1000);
  let minutes = floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;

  // Format time as MM:SS
  let timeString = nf(minutes, 2) + ":" + nf(seconds, 2);

  // Draw timer background
  fill(255);
  stroke(0);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, 70, 160, 60, 20);

  // Draw timer text
  noStroke();

  // If time is 5 seconds or less, text turns red
  if (totalSeconds <= 5) {
    fill(255, 0, 0);
  } else {
    fill(0);
  }

  textFont(openSansBold);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(timeString, width / 2, 65);
}

function displayPromptedWord(word) {
  rectMode(CORNER);
  fill(255);
  rect(0, wordBarHeight, width, 150); // Draw the word bar

  // Draw top border
  stroke(0);
  strokeWeight(1.5);
  line(0, wordBarHeight, width, wordBarHeight);

  // Draw prompted word text
  noStroke();
  textAlign(CENTER, CENTER);

  fill(0);
  textFont(openSansRegular);
  textSize(28);
  text("THE WORD IS:", width / 2, height - 100);

  // Draw each letter individually with marked tracking
  textFont(openSansBold);
  textSize(36);
  textAlign(LEFT, CENTER);

  let x = width / 2 - textWidth(word) / 2;

  for (let i = 0; i < word.length; i++) {
    if (markedLetters[i]) {
      fill(0); // Black if marked
    } else {
      fill(130); // Gray if not
    }

    text(word[i], x, height - 60);

    // Add a small buffer to avoid overlap
    x += textWidth(word[i]) + 1;
  }
}

function displayHearts() {
  for (let i = 0; i < heartsRemaining; i++) {
    image(heartImage, 20 + i * (heartSize + 10), 20, heartSize, heartSize);
  }
}

function displayScore() {
  textAlign(LEFT, TOP);
  textFont(openSansBold);
  textSize(24);
  fill(0);
  text(`Score: ${score}`, 20, 80);
}

function resetRoundState() {
  currentWord = "LOADING...";
  roundStartTime = millis();
  lastSpawnTime = millis();
  fallingLetters = [];
  clocks = [];
  wordLoaded = false;
  heartsRemaining = 3;
  letterFallSpeed = 2;
}

function nextRound(success = true) {
  if (success) {
    score++;
    wordLength = min(MAX_WORD_LENGTH, BASE_WORD_LENGTH + score);
  } else {
    score = 0;
    wordLength = BASE_WORD_LENGTH;
  }

  resetRoundState();

  // Fetch random word
  fetch(`https://random-word-api.herokuapp.com/word?length=${wordLength}`)
    .then((res) => res.json())
    .then((data) => {
      currentWord = data[0].toUpperCase();
      wordLoaded = true;
      markedLetters = new Array(currentWord.length).fill(false);
      spawnFallingLetter();
    })
    .catch((err) => {
      console.warn("API failed, using fallback:", err);
      currentWord = getFallbackWord(wordLength);
      wordLoaded = true;
      markedLetters = new Array(currentWord.length).fill(false);
      spawnFallingLetter();
    });
}

// ===== FallingLetter Class =====
class FallingLetter {
  constructor(x, y, letter, textColor = [0], bgColor = [255]) {
    this.pos = createVector(x, y);
    this.size = 50;
    this.letter = letter;
    this.textColor = textColor;
    this.bgColor = bgColor;
    this.hit = false;
    this.hitColor = null;
    this.hitTimer = 0; // Countdown before removal
  }

  update() {
    this.pos.y += letterFallSpeed;

    // Decrease hit feedback timer if active
    if (this.hit && this.hitTimer > 0) {
      this.hitTimer -= deltaTime;
    }
  }

  display() {
    // Draw the letter box
    rectMode(CENTER);

    // Hit feedback colors
    if (this.hit) {
      if (this.hitColor === "correct") {
        this.bgColor = [217, 255, 218]; // light green
        this.textColor = [0, 210, 4];
      } else if (this.hitColor === "incorrect") {
        this.bgColor = [255, 217, 217]; // red
        this.textColor = [255, 0, 0];
      }
    }

    stroke(this.textColor);
    strokeWeight(3);

    fill(this.bgColor);
    rect(this.pos.x, this.pos.y, this.size, this.size);

    // Draw the letter text
    noStroke();
    fill(this.textColor);
    textFont(openSansBold);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(this.letter, this.pos.x, this.pos.y);
  }

  isOffScreen() {
    if (gameState === "menu") {
      return this.pos.y > height;
    }
    return this.pos.y > wordBarHeight + this.size;
  }
}

// ===== Clock Class =====
class ClockItem {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 50;
  }

  update() {
    this.pos.y += letterFallSpeed;
  }

  display() {
    image(
      clockImage,
      this.pos.x - this.size / 2,
      this.pos.y - this.size / 2,
      this.size,
      this.size
    );
  }

  isOffScreen() {
    return this.pos.y > wordBarHeight + this.size;
  }
}

// ===== Ball Class =====
class Ball {
  constructor() {
    this.reset();
  }

  update() {
    if (isBallMoving) {
      this.pos.add(this.vel);

      // Reset if ball goes out of bounds
      if (
        this.pos.x < -this.radius ||
        this.pos.x > width + this.radius ||
        this.pos.y < -this.radius ||
        this.pos.y > wordBarHeight + this.radius * 2
      ) {
        this.reset();
      }
    }
  }

  display() {
    fill(0, 150, 255);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }

  launch(targetX, targetY) {
    if (!isBallMoving) {
      let dir = createVector(targetX - this.pos.x, targetY - this.pos.y);
      let distance = dir.mag(); // Get distance from ball to cursor
      dir.normalize(); // Keep only the direction

      // Scale speed based on distance
      let minSpeed = 5;
      let maxSpeed = 22;
      let speed = constrain(distance / 10, minSpeed, maxSpeed);
      dir.mult(speed);

      this.vel = dir;
      isBallMoving = true;
    }
  }

  reset() {
    this.pos = createVector(width / 2, wordBarHeight - 30);
    this.vel = createVector(0, 0);
    this.radius = 20;
    isBallMoving = false;
  }

  hit(letterBox) {
    let d = dist(this.pos.x, this.pos.y, letterBox.pos.x, letterBox.pos.y);
    return d < this.radius + letterBox.size / 2;
  }
}

// ===== Menu Button Class =====
class MenuButton {
  constructor(label, x, y, w, h) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  display() {
    rectMode(CORNER);
    fill(0, 200);
    stroke(0);
    rect(this.x, this.y, this.w, this.h, 10);

    fill(255);
    noStroke();
    textFont(openSansBold);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }

  isHovered() {
    return (
      mouseX > this.x &&
      mouseX < this.x + this.w &&
      mouseY > this.y &&
      mouseY < this.y + this.h
    );
  }

  handleClick() {
    if (this.isHovered()) {
      currentMode = this.label.toLowerCase();
      gameState = "playing";
      lossReason = "";
      fallingLettersMenu = [];
      nextRound(false);
    }
  }
}

// ===== Utility Functions =====
function pickLetter(word) {
  if (random(1) < 0.6) {
    // 60% chance: pick from the word (unmarked letters)
    let unmarkedLetters = word.split("").filter((_, i) => !markedLetters[i]);
    let index = floor(random(unmarkedLetters.length));
    return unmarkedLetters[index];
  } else {
    // 40% chance: pick random A-Z letter
    let code = floor(random(65, 91));
    return String.fromCharCode(code);
  }
}

function spawnFallingLetter() {
  let x = random(50, width - 50);
  let y = random(-100, -50);
  let letter = pickLetter(currentWord);
  fallingLetters.push(new FallingLetter(x, y, letter));
}

function spawnClock() {
  let x = random(50, width - 50);
  let y = random(-100, -50);
  clocks.push(new ClockItem(x, y));
}

function spawnMenuLetter() {
  let x = random(50, width - 50);
  let y = random(-100, -50);
  let letter = ALPHABET.charAt(floor(random(ALPHABET.length)));
  fallingLettersMenu.push(new FallingLetter(x, y, letter));
}

function getFallbackWord(length = 5) {
  let filtered = wordBank.filter((word) => word.length === length);
  return random(filtered).toUpperCase();
}

function mousePressed() {
  if (gameState === "menu") {
    modeButtons.forEach((btn) => btn.handleClick());
  } else if (!isBallMoving) {
    ball.launch(mouseX, mouseY);
  }
}
