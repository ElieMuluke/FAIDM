const ratioEl = document.getElementById("ratio");
const advEl = document.getElementById("adv");
const epsEl = document.getElementById("eps");

const ratioValue = document.getElementById("ratioValue");
const advValue = document.getElementById("advValue");
const epsValue = document.getElementById("epsValue");

const unclippedOut = document.getElementById("unclippedOut");
const clippedOut = document.getElementById("clippedOut");
const objectiveOut = document.getElementById("objectiveOut");

const clipChart = document.getElementById("clipChart");
const ctx = clipChart.getContext("2d");

const rewardsEl = document.getElementById("rewards");
const valuesEl = document.getElementById("values");
const gammaEl = document.getElementById("gamma");
const lambdaEl = document.getElementById("lambda");
const gammaValue = document.getElementById("gammaValue");
const lambdaValue = document.getElementById("lambdaValue");
const gaeOut = document.getElementById("gaeOut");
const computeGAE = document.getElementById("computeGAE");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function computeObjective() {
  const ratio = parseFloat(ratioEl.value);
  const adv = parseFloat(advEl.value);
  const eps = parseFloat(epsEl.value);

  ratioValue.textContent = ratio.toFixed(2);
  advValue.textContent = adv.toFixed(2);
  epsValue.textContent = eps.toFixed(2);

  const unclipped = ratio * adv;
  const clippedRatio = clamp(ratio, 1 - eps, 1 + eps);
  const clipped = clippedRatio * adv;
  const objective = adv >= 0 ? Math.min(unclipped, clipped) : Math.max(unclipped, clipped);

  unclippedOut.textContent = unclipped.toFixed(3);
  clippedOut.textContent = clipped.toFixed(3);
  objectiveOut.textContent = objective.toFixed(3);

  drawChart(eps, adv);
}

function drawChart(eps, adv) {
  const width = clipChart.width;
  const height = clipChart.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, 0, width, height);

  const minX = 0.5;
  const maxX = 1.5;
  const minY = -2;
  const maxY = 2;

  function mapX(x) {
    return ((x - minX) / (maxX - minX)) * (width - 40) + 20;
  }

  function mapY(y) {
    return height - 20 - ((y - minY) / (maxY - minY)) * (height - 40);
  }

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mapX(minX), mapY(0));
  ctx.lineTo(mapX(maxX), mapY(0));
  ctx.stroke();

  ctx.strokeStyle = "#c7d2fe";
  ctx.beginPath();
  ctx.moveTo(mapX(1 - eps), mapY(minY));
  ctx.lineTo(mapX(1 - eps), mapY(maxY));
  ctx.moveTo(mapX(1 + eps), mapY(minY));
  ctx.lineTo(mapX(1 + eps), mapY(maxY));
  ctx.stroke();

  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = minX; x <= maxX; x += 0.01) {
    const y = x * adv;
    const px = mapX(x);
    const py = mapY(y);
    if (x === minX) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  ctx.strokeStyle = "#10b981";
  ctx.beginPath();
  for (let x = minX; x <= maxX; x += 0.01) {
    const clippedX = clamp(x, 1 - eps, 1 + eps);
    const unclipped = x * adv;
    const clipped = clippedX * adv;
    const obj = adv >= 0 ? Math.min(unclipped, clipped) : Math.max(unclipped, clipped);
    const px = mapX(x);
    const py = mapY(obj);
    if (x === minX) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = "12px Segoe UI";
  ctx.fillText("ratio r_t", width / 2 - 20, height - 6);
  ctx.save();
  ctx.translate(8, height / 2 + 10);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("objective", 0, 0);
  ctx.restore();
}

function parseList(text) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => Number(t));
}

function computeGAEValues() {
  const rewards = parseList(rewardsEl.value);
  const values = parseList(valuesEl.value);
  const gamma = parseFloat(gammaEl.value);
  const lambda = parseFloat(lambdaEl.value);

  if (rewards.length === 0 || values.length === 0 || rewards.length !== values.length) {
    gaeOut.textContent = "Provide equal-length rewards and values.";
    return;
  }

  const advantages = new Array(rewards.length).fill(0);
  let gae = 0;
  for (let t = rewards.length - 1; t >= 0; t -= 1) {
    const nextValue = t === rewards.length - 1 ? 0 : values[t + 1];
    const delta = rewards[t] + gamma * nextValue - values[t];
    gae = delta + gamma * lambda * gae;
    advantages[t] = gae;
  }

  gaeOut.textContent = `[${advantages.map((a) => a.toFixed(3)).join(", ")}]`;
}

function updateGAESliders() {
  gammaValue.textContent = Number(gammaEl.value).toFixed(3);
  lambdaValue.textContent = Number(lambdaEl.value).toFixed(2);
}

ratioEl.addEventListener("input", computeObjective);
advEl.addEventListener("input", computeObjective);
epsEl.addEventListener("input", computeObjective);

computeGAE.addEventListener("click", computeGAEValues);
gammaEl.addEventListener("input", updateGAESliders);
lambdaEl.addEventListener("input", updateGAESliders);

updateGAESliders();
computeObjective();

const quizzes = document.querySelectorAll(".quiz");
quizzes.forEach((quiz) => {
  const button = quiz.querySelector("[data-check]");
  const feedback = quiz.querySelector(".feedback");
  const answer = quiz.dataset.answer;

  button.addEventListener("click", () => {
    const choice = quiz.querySelector("input[type=radio]:checked");
    if (!choice) {
      feedback.textContent = "Select an answer first.";
      return;
    }
    if (choice.value === answer) {
      feedback.textContent = "Correct! Great job.";
    } else {
      feedback.textContent = "Not quite. Try reviewing the section above.";
    }
  });
});
