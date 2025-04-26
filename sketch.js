let openSansRegular;
let openSansBold;

function preload() {
  openSansRegular = loadFont("assets/OpenSans-Regular.ttf");
  openSansBold = loadFont("assets/OpenSans-Bold.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(251, 250, 240); // Cream
}

function draw() {
  displayPromptedWord("APARTMENT");
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
