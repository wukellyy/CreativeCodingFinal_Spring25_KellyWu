let openSansRegular;
let openSansBold;

let wordBarHeight;
let wordLength = 5;
let currentWord = "";
let wordLoaded = false;
let markedLetters = []; // Tracks which letters have been hit

let roundStartTime;
let roundDuration = 60 * 1000; // 60 seconds

let timerPopScale = 1;
let timerPopDuration = 0;

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
let hearts = [];
const HEART_DROP_CHANCE = 0.03; // 3%
const MAX_HEARTS = 6;
let brokenHearts = []; // Store animations for broken hearts

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

let losingItems = [];
let losingItemSpawnStart = 0;
let losingItemSpawnDuration = 2000; // 2 seconds
let lastLosingItemSpawnTime = 0;
const LOSING_ITEM_SPAWN_INTERVAL = 150;
const LOSING_ITEMS_PER_WAVE = 3; // 3 items per wave

let hoverSound1, hoverSound2;
let launchSound;
let letterSound, heartSound, clockSound;
let menuMusic, gameMusic;
let losingSound;
let menuMusicFadeInTimeout = null;

let howToPlayImage;

let isPaused = false;
let pauseTimestamp = 0;
let pausedTime = 0;

let wasMenuMusicPlaying = false;
let wasGameMusicPlaying = false;
let wasLosingSoundPlaying = false;

function preload() {
  openSansRegular = loadFont("assets/font/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/font/OpenSans-Bold.ttf");

  heartImage = loadImage("assets/img/heart.png");
  clockImage = loadImage("assets/img/clock.png");

  hoverSound1 = loadSound("assets/audio/button_hover_01.mp3");
  hoverSound1.setVolume(0.3);
  hoverSound1.playMode("restart");

  hoverSound2 = loadSound("assets/audio/button_hover_02.mp3");
  hoverSound2.setVolume(0.3);
  hoverSound2.playMode("restart");

  launchSound = loadSound("assets/audio/ball_launch.mp3");
  launchSound.setVolume(0.3);
  launchSound.playMode("restart");

  letterSound = loadSound("assets/audio/letter_sound.mp3");
  letterSound.setVolume(0.15);
  letterSound.playMode("restart");

  heartSound = loadSound("assets/audio/heart_sound.wav");
  heartSound.setVolume(0.1);
  heartSound.playMode("restart");

  clockSound = loadSound("assets/audio/clock_sound.mp3");
  clockSound.setVolume(0.3);
  clockSound.playMode("restart");

  menuMusic = loadSound("assets/audio/start_menu_music.mp3");
  menuMusic.setVolume(0.25);
  menuMusic.setLoop(true);

  gameMusic = loadSound("assets/audio/in_game_music.mp3");
  gameMusic.setVolume(0.25);
  gameMusic.setLoop(true);

  losingSound = loadSound("assets/audio/losing_sound.mp3");
  losingSound.setVolume(0.2);
  losingSound.playMode("restart");

  // Fallback word list in case Random Word API has a server error
  wordBank = loadStrings("assets/wordlist.txt");

  howToPlayImage = loadImage("assets/img/how_to_play.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  wordBarHeight = height - 150;
  ball = new Ball();

  // Mode buttons
  const labels = ["Normal", "Shrink", "Rotate", "Mirror"];
  for (let i = 0; i < labels.length; i++) {
    let x = width / 2 - 100;
    let y = height / 2 - 60 + i * 70;
    modeButtons.push(new MenuButton(labels[i], x, y, 200, 50, i));
  }
}

function draw() {
  background(251, 250, 240); // Cream

  if (gameState !== "menu" && menuMusic.isPlaying()) {
    menuMusic.stop();
  }

  if (gameState === "menu") {
    if (!isPaused && !menuMusic.isPlaying() && !wasMenuMusicPlaying) {
      menuMusic.play();
    }

    displayStartMenu();
    drawHelpButton();

    if (isPaused) {
      displayPauseOverlay();
      return;
    }

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

  // console.log(
  //   `Mode: ${currentMode}, Score: ${score}, Speed: ${letterFallSpeed}`
  // );

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
    } else if (isBallMoving && ball.hit(clocks[i])) {
      if (clockSound) {
        clockSound.play();
      }

      roundStartTime += CLOCK_TIME_BONUS; // Add time

      // Time pop effect
      timerPopScale = 1.4;
      timerPopDuration = 200;

      clocks.splice(i, 1);
      ball.reset();
    }
  }

  // Heart drop logic
  for (let i = hearts.length - 1; i >= 0; i--) {
    hearts[i].update();
    hearts[i].display();

    if (hearts[i].isOffScreen()) {
      hearts.splice(i, 1);
    } else if (isBallMoving && ball.hit(hearts[i])) {
      if (heartSound) {
        heartSound.play();
      }

      if (heartsRemaining < MAX_HEARTS) {
        heartsRemaining++; // Gain a heart
      }
      hearts.splice(i, 1);
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

    // Chance for heart to drop
    if (random() < HEART_DROP_CHANCE) {
      spawnHeart();
    }

    lastSpawnTime = millis();
  }

  // Draw aiming guide if not launched yet
  if (!isBallMoving) {
    stroke(0);
    strokeWeight(2);
    line(ball.pos.x, ball.pos.y, mouseX, mouseY);

    // Draw dashed line guide to help user
    if (currentMode === "mirror") {
      let mirrorX = 2 * ball.pos.x - mouseX;

      drawingContext.setLineDash([10, 10]);
      line(ball.pos.x, ball.pos.y, mirrorX, mouseY);
      drawingContext.setLineDash([]);
    }
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

        if (letterSound) {
          letterSound.play();
        }

        // Mark as hit and trigger feedback colors
        fallingLetters[i].hit = true;
        fallingLetters[i].hitColor = correctHit ? "correct" : "incorrect";
        fallingLetters[i].hitTimer = 100;
        ball.reset();

        if (correctHit) {
          letterFallSpeed = min(MAX_FALL_SPEED, letterFallSpeed * 1.2); // Increase speed on correct hit
        } else {
          // Calculate the on-screen position of the last heart
          let heartX =
            20 + (heartsRemaining - 1) * (heartSize + 10) + heartSize / 2;
          let heartY = 20 + heartSize / 2;
          brokenHearts.push(new BrokenHeart(heartX, heartY));

          heartsRemaining--;
          letterFallSpeed = max(MIN_FALL_SPEED, letterFallSpeed * 0.9); // Decrease speed on incorrect hit

          // Go back to start menu if out of lives
          if (heartsRemaining <= 0) {
            lossReason = "OUT OF LIVES";
            gameState = "menu";
            currentMode = "";
            fallingLetters = [];
            clocks = [];

            if (gameMusic.isPlaying()) {
              gameMusic.stop();
            }

            if (losingSound.isPlaying()) {
              losingSound.stop();
            }
            losingSound.setVolume(0.2);
            losingSound.play();

            fadeInMenuMusicAfterDelay();

            losingItemSpawnStart = millis();
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

  // Animate timer pop if active
  if (timerPopDuration > 0) {
    timerPopDuration -= deltaTime;
    timerPopScale -= 0.01;
    if (timerPopScale < 1) {
      timerPopScale = 1;
    }
  } else {
    timerPopScale = 1;
  }

  displayTimer();
  displayPromptedWord(currentWord);
  displayHearts();

  // Broken heart animations
  for (let i = brokenHearts.length - 1; i >= 0; i--) {
    brokenHearts[i].update();
    brokenHearts[i].display();
    if (brokenHearts[i].isExpired()) {
      brokenHearts.splice(i, 1);
    }
  }

  displayScore();
  displayGameMode();
  drawHelpButton();

  // Go back to start menu if out of time
  if (millis() - roundStartTime > roundDuration) {
    lossReason = "OUT OF TIME";
    gameState = "menu";
    currentMode = "";
    fallingLetters = [];
    clocks = [];

    if (gameMusic.isPlaying()) {
      gameMusic.stop();
    }

    if (losingSound.isPlaying()) {
      losingSound.stop();
    }
    losingSound.setVolume(0.2);
    losingSound.play();

    fadeInMenuMusicAfterDelay();

    losingItemSpawnStart = millis();
    return;
  }

  if (isPaused) {
    displayPauseOverlay();
    return;
  }
}

function displayStartMenu() {
  background(251, 250, 240); // Cream

  // Falling background letters
  if (!isPaused) {
    for (let i = fallingLettersMenu.length - 1; i >= 0; i--) {
      fallingLettersMenu[i].update(2);
      fallingLettersMenu[i].display();

      if (fallingLettersMenu[i].isOffScreen()) {
        fallingLettersMenu.splice(i, 1);
      }
    }

    if (millis() - lastMenuSpawnTime > MENU_SPAWN_INTERVAL) {
      spawnMenuLetter();
      lastMenuSpawnTime = millis();
    }
  } else {
    // Display without updating letter positions
    for (let i = fallingLettersMenu.length - 1; i >= 0; i--) {
      fallingLettersMenu[i].display();
    }
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
  strokeWeight(3);
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

  // Spawn losing items
  if (
    (lossReason === "OUT OF TIME" || lossReason === "OUT OF LIVES") &&
    millis() - losingItemSpawnStart < losingItemSpawnDuration &&
    millis() - lastLosingItemSpawnTime > LOSING_ITEM_SPAWN_INTERVAL
  ) {
    for (let i = 0; i < LOSING_ITEMS_PER_WAVE; i++) {
      const x = random(50, width - 50);
      const y = random(-300, -50);

      let item;
      if (lossReason === "OUT OF TIME") {
        item = new FallingClock(x, y, 100);
      } else if (lossReason === "OUT OF LIVES") {
        item = new FallingHeart(x, y, 100);
      }

      losingItems.push(item);
    }

    lastLosingItemSpawnTime = millis();
  }

  // Display/update losing clocks
  for (let i = losingItems.length - 1; i >= 0; i--) {
    losingItems[i].update(5);
    losingItems[i].display();

    if (losingItems[i].pos.y > height + losingItems[i].size) {
      losingItems.splice(i, 1);
    }
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
  textSize(32 * timerPopScale);
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

function displayGameMode() {
  if (currentMode) {
    textAlign(LEFT, TOP);
    textFont(openSansBold);
    textSize(18);
    fill(80);
    text(
      `Mode: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`,
      20,
      120
    );
  }
}

function resetRoundState() {
  currentWord = "LOADING...";
  wordLoaded = false;
  roundStartTime = millis();
  lastSpawnTime = millis();

  fallingLetters = [];
  clocks = [];
  hearts = [];
  brokenHearts = [];
  markedLetters = [];

  letterFallSpeed = 2;
  heartsRemaining = 3;

  ball.reset();
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
    this.rotationAngle = 0;
  }

  update(speed = letterFallSpeed) {
    this.pos.y += speed;

    // Decrease hit feedback timer if active
    if (this.hit && this.hitTimer > 0) {
      this.hitTimer -= deltaTime;
    }

    // Shrink Mode: shrink size gradually until minimum
    if (currentMode === "shrink") {
      this.size = max(30, this.size - 0.15);
    }
    // Rotate Mode: keep rotating letter box
    else if (currentMode === "rotate") {
      this.rotationAngle += 0.05;
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    if (currentMode === "rotate") {
      rotate(this.rotationAngle);
    }

    rectMode(CENTER);

    // Hit feedback colors
    if (this.hit) {
      if (this.hitColor === "correct") {
        this.bgColor = [217, 255, 218]; // Light green
        this.textColor = [0, 210, 4];
      } else if (this.hitColor === "incorrect") {
        this.bgColor = [255, 217, 217]; // Light red
        this.textColor = [255, 0, 0];
      }
    }

    // Draw the letter box
    stroke(this.textColor);
    strokeWeight(3);
    fill(this.bgColor);
    rect(0, 0, this.size, this.size);

    // Draw the letter text
    noStroke();
    fill(this.textColor);
    textFont(openSansBold);
    textSize(this.size * 0.5);
    textAlign(CENTER, CENTER);
    text(this.letter, 0, 0);

    pop();
  }

  isOffScreen() {
    if (gameState === "menu") {
      return this.pos.y > height;
    }
    return this.pos.y > wordBarHeight + this.size;
  }
}

// ===== FallingClock Class =====
class FallingClock {
  constructor(x, y, size = 50) {
    this.pos = createVector(x, y);
    this.size = size;
  }

  update(speed = letterFallSpeed) {
    this.pos.y += speed;

    if (currentMode === "shrink") {
      this.size = max(30, this.size - 0.1);
    }
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

// ===== FallingHeart Class =====
class FallingHeart {
  constructor(x, y, size = 40) {
    this.pos = createVector(x, y);
    this.size = size;
  }

  update(speed = letterFallSpeed) {
    this.pos.y += speed;

    if (currentMode === "shrink") {
      this.size = max(25, this.size - 0.1);
    }
  }

  display() {
    image(
      heartImage,
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

// ===== BrokenHeart Class =====
class BrokenHeart {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.timer = 400;

    // Get left and right halves of the heart
    const halfW = heartImage.width / 2;
    const h = heartImage.height;

    this.leftHalf = heartImage.get(0, 0, halfW, h);
    this.rightHalf = heartImage.get(halfW, 0, halfW, h);
  }

  update() {
    this.timer -= deltaTime;
  }

  display() {
    push();
    imageMode(CENTER);
    translate(this.pos.x, this.pos.y);

    // Left half
    push();
    translate(-10, 0); // Slide left
    rotate(-PI / 16); // Tilt counterclockwise
    image(this.leftHalf, 0, 0, heartSize / 2, heartSize);
    pop();

    // Right half
    push();
    translate(10, 0); // Slide right
    rotate(PI / 16); // Tilt clockwise
    image(this.rightHalf, 0, 0, heartSize / 2, heartSize);
    pop();

    pop();
  }

  isExpired() {
    return this.timer <= 0;
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

      // Mirror Mode: Flip the x direction of ball launch
      if (currentMode === "mirror") {
        dir.x *= -1;
      }

      // Scale speed based on distance
      let minSpeed = 10;
      let maxSpeed = 25;
      let speed = constrain(distance / 10, minSpeed, maxSpeed);

      dir.mult(speed);
      this.vel = dir;

      if (launchSound) {
        launchSound.play();
      }

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
  constructor(label, x, y, w, h, index) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.index = index;
    this.wasHovered = false;
  }

  display() {
    const hovering = this.isHovered();

    if (!isPaused && hovering && !this.wasHovered) {
      if (this.index % 2 === 0 && !hoverSound1.isPlaying()) {
        hoverSound1.play();
      } else if (!hoverSound2.isPlaying()) {
        hoverSound2.play();
      }
    }

    this.wasHovered = hovering;

    rectMode(CORNER);
    fill(0, hovering ? 160 : 200);
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
      losingItems = [];

      if (losingSound.isPlaying()) {
        losingSound.stop();
      }

      if (menuMusic.isPlaying()) {
        menuMusic.stop();
      }

      if (!gameMusic.isPlaying()) {
        gameMusic.play();
      }

      nextRound(false);
    }
  }
}

// ===== Utility Functions =====
function pickLetter(word) {
  let unmarkedLetters = word.split("").filter((_, i) => !markedLetters[i]);
  let chance = 0.6;

  if (unmarkedLetters.length === 1) {
    chance = 0.4;
  } else if (unmarkedLetters.length > 1 && unmarkedLetters.length < 4) {
    chance = 0.5;
  }

  if (random(1) < chance) {
    // Pick unmarked letter from prompted word
    let index = floor(random(unmarkedLetters.length));
    return unmarkedLetters[index];
  } else {
    // Pick random A-Z letter
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
  const possibleX = [];
  for (let i = 50; i <= width - 50; i += 10) {
    if (!isTooCloseToLetter(i)) {
      possibleX.push(i);
    }
  }

  if (possibleX.length > 0) {
    const x = random(possibleX);
    const y = random(-100, -50);
    clocks.push(new FallingClock(x, y, 50));
  }
}

function spawnHeart() {
  const possibleX = [];
  for (let i = 50; i <= width - 50; i += 10) {
    if (!isTooCloseToLetter(i)) {
      possibleX.push(i);
    }
  }

  if (possibleX.length > 0) {
    const x = random(possibleX);
    const y = random(-100, -50);
    hearts.push(new FallingHeart(x, y, 40));
  }
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

function isTooCloseToLetter(x, minDistance = 60) {
  for (let letter of fallingLetters) {
    if (abs(x - letter.pos.x) < minDistance) {
      return true;
    }
  }
  return false;
}

function drawHelpButton() {
  const x = width - 40;
  const y = 40;
  const r = 25;

  const hovering = dist(mouseX, mouseY, x, y) < r;

  // Button circle
  fill(hovering ? "#f6bd60" : "#f4a261");
  stroke("#d97706");
  strokeWeight(2);
  ellipse(x, y, r * 2);

  // Question mark
  fill(255);
  noStroke();
  textFont(openSansBold);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("?", x, y - 2);
}

function togglePause() {
  isPaused = !isPaused;

  if (isPaused) {
    pauseTimestamp = millis();
    noLoop();

    // Remember what was playing
    wasMenuMusicPlaying = menuMusic.isPlaying();
    wasGameMusicPlaying = gameMusic.isPlaying();
    wasLosingSoundPlaying = losingSound.isPlaying();

    // Pause if playing
    if (wasMenuMusicPlaying) {
      menuMusic.pause();
    }
    if (wasGameMusicPlaying) {
      gameMusic.pause();
    }
    if (wasLosingSoundPlaying) {
      losingSound.pause();
    }
  } else {
    const deltaPaused = millis() - pauseTimestamp;
    roundStartTime += deltaPaused;
    loop();

    // Only resume music if it was previously playing
    if (gameState === "menu" && wasMenuMusicPlaying) {
      menuMusic.play();
      wasMenuMusicPlaying = false;
    }
    if (gameState === "playing" && wasGameMusicPlaying) {
      gameMusic.play();
      wasGameMusicPlaying = false;
    }
    if (gameState === "menu" && wasLosingSoundPlaying) {
      losingSound.play();
      wasLosingSoundPlaying = false;
    }
  }
}

function displayPauseOverlay() {
  // Dim screen
  fill(0, 180);
  noStroke();
  rect(0, 0, width, height);

  // Show How to Play image
  push();
  imageMode(CENTER);
  image(
    howToPlayImage,
    width / 2,
    height / 2,
    howToPlayImage.width * 0.6,
    howToPlayImage.height * 0.6
  );
  pop();
}

function fadeInMenuMusicAfterDelay(delay = 2500) {
  // Cancel any existing timeout
  if (menuMusicFadeInTimeout) {
    clearTimeout(menuMusicFadeInTimeout);
  }

  menuMusicFadeInTimeout = setTimeout(() => {
    // Do not play menu music if the game is still paused
    if (isPaused) {
      menuMusicFadeInTimeout = null;
      return;
    }

    menuMusic.setVolume(0);
    if (!menuMusic.isPlaying()) menuMusic.play();
    menuMusic.setVolume(0.25, 2); // Fade in over 2 seconds
    menuMusicFadeInTimeout = null;
  }, delay);
}

function mousePressed() {
  // Pause/resume when clicking help button
  const dx = mouseX - (width - 40);
  const dy = mouseY - 40;
  if (sqrt(dx * dx + dy * dy) < 25) {
    togglePause();
    return;
  }

  // Resume if clicking anywhere while paused
  if (isPaused) {
    togglePause();
    return;
  }

  // Game interactions
  if (gameState === "menu") {
    modeButtons.forEach((btn) => btn.handleClick());
  } else if (!isBallMoving) {
    ball.launch(mouseX, mouseY);
  }
}
