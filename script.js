let canvas, ctx, svg, currentLetter = 0, lettersData;
let drawnPoints = [], requiredPixels = [];
let pathElement;

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

  window.addEventListener('resize', () => {
    resizeCanvas();
    drawLetter(currentLetter);
  });
}

function drawLetter(index) {
  svg.innerHTML = '';
  const { path } = lettersData[index];

  pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElement.setAttribute("d", path);
  svg.appendChild(pathElement);

  requiredPixels = getSampledPathPixels(pathElement, canvas.width, canvas.height);
}

function getSampledPathPixels(pathEl, width, height) {
  const pixels = [];
  const pathLength = pathEl.getTotalLength();
  for (let i = 0; i < pathLength; i += 2) {
    const point = pathEl.getPointAtLength(i);
    const x = (point.x / 100) * width;
    const y = (point.y / 100) * height;
    pixels.push({ x, y });
  }
  return pixels;
}

function initDrawing() {
  let drawing = false;

  const start = (e) => {
    drawing = true;
    const point = getXY(e);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const move = (e) => {
    if (!drawing) return;
    const point = getXY(e);
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#333";
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    drawnPoints.push(point);
    checkMatch();
  };

  const end = () => {
    drawing = false;
    ctx.beginPath();
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", end);

  canvas.addEventListener("touchstart", start);
  canvas.addEventListener("touchmove", move);
  canvas.addEventListener("touchend", end);
}

function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function checkMatch() {
  if (drawnPoints.length < 10) return;

  let matched = 0;
  const threshold = 20; // tolerance in pixels

  for (const target of requiredPixels) {
    for (const drawn of drawnPoints) {
      const dx = target.x - drawn.x;
      const dy = target.y - drawn.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < threshold) {
        matched++;
        break;
      }
    }
  }

  const accuracy = matched / requiredPixels.length;
  console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%`);

  if (accuracy >= 0.9) {
    document.getElementById("next-btn").hidden = false;
  }
}

function resetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawnPoints = [];
  requiredPixels = [];
  document.getElementById('next-btn').hidden = true;
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  resetCanvas();
}
