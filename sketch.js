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

  displayPromptedWord(currentWord);

  // Go to next round when time is up
  if (millis() - roundStartTime > roundDuration) {
    nextRound();
  }
}

function displayPromptedWord(word) {
  fill(255);
  rect(0, height - 150, width, 150);

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
  roundStartTime = millis();

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
