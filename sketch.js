let openSansRegular;
let openSansBold;
let wordLength = 5;
let currentWord = "";
let roundStartTime;
let roundDuration = 30 * 1000; // 30 seconds
let fallingLetters = [];
let spawnInterval = 1000; // Spawn new letter every 1 second
let lastSpawnTime = 0;
let wordLoaded = false;

function preload() {
  openSansRegular = loadFont("assets/Open_Sans/static/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/Open_Sans/static/OpenSans-Bold.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  nextRound(); // Start first round
}

function draw() {
  background(251, 250, 240); // Cream

  for (let i = fallingLetters.length - 1; i >= 0; i--) {
    fallingLetters[i].update();
    fallingLetters[i].display();

    // Remove letter if it goes off screen
    if (fallingLetters[i].isOffScreen()) {
      fallingLetters.splice(i, 1);
    }
  }

  // Spawn new falling letters during round
  if (millis() - lastSpawnTime > spawnInterval && wordLoaded) {
    spawnFallingLetter();
    lastSpawnTime = millis();
  }

  displayTimer();
  displayPromptedWord(currentWord);

  // Go to next round when time is up
  if (millis() - roundStartTime > roundDuration) {
    nextRound();
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
  rect(0, height - 150, width, 150); // Draw the word bar

  // Draw top border
  stroke(0);
  strokeWeight(1.5);
  line(0, height - 150, width, height - 150);

  // Draw prompted word text
  noStroke();
  textAlign(CENTER, CENTER);

  fill(0);
  textFont(openSansRegular);
  textSize(28);
  text("THE WORD IS:", width / 2, height - 100);

  fill(100);
  textFont(openSansBold);
  textSize(36);
  text(word, width / 2, height - 60);
}

function nextRound() {
  currentWord = "LOADING...";
  roundStartTime = millis(); // Reset round timer
  lastSpawnTime = millis();
  fallingLetters = [];
  wordLoaded = false;

  // Fetch random word
  fetch(`https://random-word-api.herokuapp.com/word?length=${wordLength}`)
    .then((res) => res.json())
    .then((data) => {
      currentWord = data[0].toUpperCase();
      wordLoaded = true;
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
  constructor(x, y, letter, bgColor = [255]) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 2);
    this.size = 50;
    this.letter = letter;
    this.bgColor = bgColor;
    this.hit = false;
  }

  update() {
    this.pos.add(this.vel);
  }

  display() {
    // Draw the letter box
    rectMode(CENTER);
    stroke(0);
    fill(this.bgColor);
    rect(this.pos.x, this.pos.y, this.size, this.size);

    // Draw the letter text
    noStroke();
    fill(0);
    textFont(openSansBold);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(this.letter, this.pos.x, this.pos.y);
  }

  isOffScreen() {
    return this.pos.y > height + this.size;
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
