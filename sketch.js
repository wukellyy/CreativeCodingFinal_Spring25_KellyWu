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
const MIN_FALL_SPEED = 1.5; // Minimum falling speed
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

function preload() {
  openSansRegular = loadFont("assets/Open_Sans/static/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/Open_Sans/static/OpenSans-Bold.ttf");
  heartImage = loadImage("assets/heart.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  wordBarHeight = height - 150;
  ball = new Ball();

  nextRound(false); // Start first round
}

function draw() {
  background(251, 250, 240); // Cream

  console.log(`Score: ${score}, Speed: ${letterFallSpeed}`);

  // Falling letters logic
  for (let i = fallingLetters.length - 1; i >= 0; i--) {
    fallingLetters[i].update();
    fallingLetters[i].display();

    // Remove letter if it goes off screen
    if (fallingLetters[i].isOffScreen()) {
      fallingLetters.splice(i, 1);
    }
  }

  // Dynamically adjust spawn rate based on fall speed
  spawnInterval = max(
    MAX_SPAWN_RATE,
    BASE_SPAWN_INTERVAL - (letterFallSpeed - 2) * 100
  );

  // Spawn new falling letters during round
  if (millis() - lastSpawnTime > spawnInterval && wordLoaded) {
    spawnFallingLetter();
    lastSpawnTime = millis();
  }

  // Ball logic
  ball.update();
  ball.display();

  // Draw aiming guide if not launched yet
  if (!isBallMoving) {
    stroke(0);
    strokeWeight(2);
    line(ball.pos.x, ball.pos.y, mouseX, mouseY);
  }

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

        fallingLetters.splice(i, 1);
        ball.reset();

        if (correctHit) {
          letterFallSpeed *= 1.2; // Increase speed on correct hit
        } else {
          heartsRemaining--;
          letterFallSpeed = max(MIN_FALL_SPEED, letterFallSpeed * 0.9); // Decrease speed on incorrect hit
          if (heartsRemaining <= 0) {
            nextRound(false); // Reset the round if out of lives
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

  displayTimer();
  displayPromptedWord(currentWord);
  displayHearts();
  displayScore();

  // Go to next round when time is up
  if (millis() - roundStartTime > roundDuration) {
    nextRound(false);
  }
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
      fill(100); // Gray if not
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

function nextRound(success = true) {
  if (success) {
    score++;
    wordLength = min(MAX_WORD_LENGTH, BASE_WORD_LENGTH + score);
  } else {
    score = 0;
    wordLength = BASE_WORD_LENGTH;
  }

  currentWord = "LOADING...";
  roundStartTime = millis(); // Reset round timer
  lastSpawnTime = millis();
  fallingLetters = [];
  wordLoaded = false;
  heartsRemaining = 3; // Reset lives
  letterFallSpeed = 2; // Reset to normal speed

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
      console.error("Failed to fetch word:", err);
      currentWord = "";
      wordLoaded = false;
    });
}

// ===== FallingLetter Class =====
class FallingLetter {
  constructor(x, y, letter, textColor = [0], bgColor = [255]) {
    this.pos = createVector(x, y);
    // this.vel = createVector(0, letterFallSpeed);
    this.size = 50;
    this.letter = letter;
    this.textColor = textColor;
    this.bgColor = bgColor;
    this.hit = false;
  }

  update() {
    // this.pos.add(this.vel);
    this.pos.y += letterFallSpeed;
  }

  display() {
    // Draw the letter box
    rectMode(CENTER);
    stroke(0);
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
      dir.normalize(); // Keep only the direction
      dir.mult(ballSpeed);
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

function pickLetter(word) {
  if (random(1) < 0.7) {
    // 70% chance: pick from the word
    let index = floor(random(word.length));
    return word[index];
  } else {
    // 30% chance: pick random A-Z letter
    let code = floor(random(65, 91)); // ASCII codes for A-Z
    return String.fromCharCode(code);
  }
}

function spawnFallingLetter() {
  let x = random(50, width - 50);
  let y = random(-100, -50);
  let letter = pickLetter(currentWord);
  fallingLetters.push(new FallingLetter(x, y, letter));
}

function mousePressed() {
  if (!isBallMoving) {
    ball.launch(mouseX, mouseY);
  }
}
