let openSansRegular;
let openSansBold;
let wordLength = 5;
let currentWord = "";
let roundStartTime;
let roundDuration = 15 * 1000; // 15 seconds

function preload() {
  openSansRegular = loadFont("assets/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/OpenSans-Bold.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  nextRound(); // Start first round
}

function draw() {
  background(251, 250, 240); // Cream

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

  textFont(openSansBold);
  textSize(36);
  text(word, width / 2, height - 60);
}

function nextRound() {
  currentWord = "LOADING...";
  roundStartTime = millis(); // Reset round timer

  // Fetch random word
  fetch(`https://random-word-api.herokuapp.com/word?length=${wordLength}`)
    .then((res) => res.json())
    .then((data) => {
      currentWord = data[0].toUpperCase();
    })
    .catch((err) => {
      console.error("Failed to fetch word:", err);
      currentWord = "ERROR";
    });
}
