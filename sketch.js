window.saveDataAcrossSessions = true;

let calibrationPoints = [
  [0.05, 0.05], // top-left
  [0.5, 0.05], // top-center
  [0.95, 0.05], // top-right
  [0.05, 0.5], // mid-left
  [0.5, 0.5], // center
  [0.95, 0.5], // mid-right
  [0.05, 0.95], // bottom-left
  [0.5, 0.95], // bottom-center
  [0.95, 0.95], // bottom-right
];

let currentPoint = 0;
let clickCount = 0;
const clicksPerPoint = 5;

let isCalibrated = false;
let gazeX = null;
let gazeY = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textSize(20);
  fill(255);

  // WebGazer setup
  window.webgazer
    .setGazeListener((data, elapsedTime) => {
      if (data) {
        gazeX = data.x;
        gazeY = data.y;

        if (isCalibrated) {
          console.log(
            `gazeX: ${gazeX.toFixed(1)}, gazeY: ${gazeY.toFixed(
              1
            )}, time: ${elapsedTime.toFixed(0)} ms`
          );
        }
      }
    })
    .begin();

  // Show webcam and face box
  window.webgazer.showVideo(true);
  window.webgazer.showFaceOverlay(true);
  window.webgazer.showFaceFeedbackBox(true);
}

function draw() {
  clear(); // Transparent canvas to see webcam video
  // Prob start the cam at center and when top left dot is done, move back to top left

  if (!isCalibrated) {
    showCalibrationDot();

    fill(255);

    textSize(18);
    text(
      `Click the dot 5 times (${clickCount} / ${clicksPerPoint})\n` +
        `Point ${currentPoint + 1} of ${calibrationPoints.length}`,
      width / 2,
      40
    );

    textSize(16);
    text(
      "Please contain your head in the video box and be steady.\n" +
        "Look directly at the dot. Avoid blinking when clicking.",
      width / 2,
      100
    );
  }
}

function showCalibrationDot() {
  const [relX, relY] = calibrationPoints[currentPoint];
  const x = relX * width;
  const y = relY * height;

  if (clickCount === 0) {
    fill(0, 255, 0); // Green
  } else if (clickCount === 1) {
    fill(173, 255, 47); // Yellow-green
  } else if (clickCount === 2) {
    fill(255, 204, 0); // Yellow
  } else if (clickCount === 3) {
    fill(255, 102, 0); // Orange
  } else if (clickCount === 4) {
    fill(255, 0, 0); // Red
  }

  noStroke();
  ellipse(x, y, 30, 30);
}

function mousePressed() {
  if (!isCalibrated && currentPoint < calibrationPoints.length) {
    const [relX, relY] = calibrationPoints[currentPoint];
    const dotX = relX * width;
    const dotY = relY * height;
    const distance = dist(mouseX, mouseY, dotX, dotY);

    if (distance <= 15) {
      window.webgazer.recordScreenPosition(mouseX, mouseY, "click");
      clickCount++;

      if (clickCount >= clicksPerPoint) {
        clickCount = 0;
        currentPoint++;
      }

      if (currentPoint >= calibrationPoints.length) {
        isCalibrated = true;
      }
    }
  }
}
