let openSansRegular;
let openSansBold;
let wordLength = 5;
let currentWord = "LOADING...";

function preload() {
  openSansRegular = loadFont("assets/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/OpenSans-Bold.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(251, 250, 240); // Cream

  // Fetch random word
  fetch(`https://random-word-api.herokuapp.com/word?length=${wordLength}`)
    .then((response) => response.json())
    .then((data) => {
      currentWord = data[0].toUpperCase();
    })
    .catch((err) => {
      console.error("Failed to fetch word:", err);
      currentWord = "ERROR: Failed to fetch word";
    });
}

function draw() {
  background(251, 250, 240);
  displayPromptedWord(currentWord);
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
