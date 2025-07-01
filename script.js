let canvas, ctx, svg, currentLetter = 0, lettersData, pathElement;
let drawnPixels = new Set();
let requiredPixels = new Set();

fetch('letters.json')
  .then(res => res.json())
  .then(data => {
    lettersData = data;
    initGame();
  });

function initGame() {
  canvas = document.getElementById('trace-canvas');
  ctx = canvas.getContext('2d');
  svg = document.getElementById('letter-svg');
  resizeCanvas();

  drawLetter(currentLetter);
  initDrawing();

  document.getElementById('next-btn').onclick = () => {
    currentLetter = (currentLetter + 1) % lettersData.length;
    resetCanvas();
    drawLetter(currentLetter);
  };

  window.addEventListener('resize', resizeCanvas);
}

function drawLetter(index) {
  svg.innerHTML = '';
  const { path } = lettersData[index];
  pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElement.setAttribute("d", path);
  svg.appendChild(pathElement);

  // Sample the path into points
  requiredPixels = getSampledPathPixels(pathElement, canvas.width, canvas.height);
}

function getSampledPathPixels(pathEl, width, height) {
  const pixels = new Set();
  const pathLength = pathEl.getTotalLength();
  for (let i = 0; i < pathLength; i += 1) {
    const point = pathEl.getPointAtLength(i);
    const x = Math.floor((point.x / 100) * width);
    const y = Math.floor((point.y / 100) * height);
    pixels.add(`${x},${y}`);
  }
  return pixels;
}

function initDrawing() {
  let drawing = false;

  const draw = (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.touches ? e.touches[0].clientX : e.clientX) - rect.left);
    const y = Math.floor((e.touches ? e.touches[0].clientY : e.clientY) - rect.top);

    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#333";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    drawnPixels.add(`${x},${y}`);
    checkMatch();
  };

  canvas.addEventListener("mousedown", e => {
    drawing = true;
    ctx.beginPath();
    draw(e);
  });

  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
  });

  canvas.addEventListener("touchstart", e => {
    drawing = true;
    ctx.beginPath();
    draw(e);
  });

  canvas.addEventListener("touchmove", draw);
  canvas.addEventListener("touchend", () => {
    drawing = false;
    ctx.beginPath();
  });
}

function checkMatch() {
  const overlap = [...drawnPixels].filter(p => requiredPixels.has(p)).length;
  const accuracy = overlap / requiredPixels.size;
  if (accuracy > 0.9) {
    document.getElementById('next-btn').hidden = false;
  }
}

function resetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawnPixels.clear();
  requiredPixels.clear();
  document.getElementById('next-btn').hidden = true;
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  resetCanvas();
  drawLetter(currentLetter);
}
