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
  if (!rewardsEl || !valuesEl || !gammaEl || !lambdaEl || !gaeOut) {
    return;
  }

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
  if (!gammaEl || !lambdaEl || !gammaValue || !lambdaValue) {
    return;
  }
  gammaValue.textContent = Number(gammaEl.value).toFixed(3);
  lambdaValue.textContent = Number(lambdaEl.value).toFixed(2);
}

ratioEl.addEventListener("input", computeObjective);
advEl.addEventListener("input", computeObjective);
epsEl.addEventListener("input", computeObjective);

if (computeGAE && gammaEl && lambdaEl) {
  computeGAE.addEventListener("click", computeGAEValues);
  gammaEl.addEventListener("input", updateGAESliders);
  lambdaEl.addEventListener("input", updateGAESliders);
  updateGAESliders();
}
computeObjective();

const quizExplanations = {
  q1: {
    correct: "✓ Correct! When r_t > 1+ε and advantage is positive, the unclipped objective keeps growing (ratio × advantage). But the clipped version caps r_t at 1+ε, creating a flat line. The min() function chooses the clipped (smaller) value, so the objective stops growing.",
    a: "✗ Incorrect. If we didn't clip, the objective would keep increasing. But PPO uses clipping to prevent this.",
    b: "✓ This is the right answer! The clipped term acts as a safety ceiling.",
    c: "✗ Incorrect. The objective doesn't become negative just because r_t is large. It gets capped instead."
  },
  q2: {
    correct: "✓ Correct! Higher λ (closer to 1) means more future TD residuals are included in the advantage estimate. This reduces bias (better estimates) but increases variance (more noise from far-away rewards). Lower λ (closer to 0) uses mostly immediate rewards—low variance but biased.",
    a: "✗ Incorrect. This is backwards! Increasing λ actually decreases bias and increases variance.",
    b: "✗ Incorrect. λ definitely affects the bias-variance tradeoff in advantage estimation.",
    c: "✓ This is correct! This is the fundamental bias-variance tradeoff of GAE."
  },
  q3: {
    correct: "✓ Correct! The entropy bonus -c₂·S in the loss encourages the policy to maintain randomness. If entropy is high, the agent explores more actions. This prevents premature convergence to suboptimal strategies and helps discover better policies.",
    a: "✓ This is the right answer! Entropy bonus directly encourages exploration.",
    b: "✗ Incorrect. Value loss measures prediction accuracy, not exploration.",
    c: "✗ Incorrect. Clipping prevents too-large updates, but doesn't directly encourage exploration."
  },
  q4: {
    correct: "✓ Correct! Decreasing ε makes the clipping region narrower (e.g., [0.9, 1.1] instead of [0.8, 1.2]). This prevents large policy changes, which directly stabilizes training when updates are too drastic.",
    a: "✗ Incorrect! Increasing learning rate makes updates larger, which would worsen instability.",
    b: "✓ This is right! Tighter clipping = smaller policy changes = more stable training.",
    c: "✗ Incorrect. Entropy bonus helps exploration but doesn't directly address large updates."
  },
  q5: {
    correct: "✓ Correct! r_t = π_new(a|s) / π_old(a|s) = 0.30 / 0.10 = 3.0. The new policy increased the action probability by 3x, so the ratio is 3.0.",
    a: "✗ Incorrect. 0.33 is the inverse ratio (10% / 30%). We compute new / old, not old / new.",
    b: "✗ Incorrect. 2.0 would be if the new policy was 20%, not 30%.",
    c: "✓ This is correct! 30% / 10% = 3.0"
  },
  q6: {
    correct: "✓ Correct! Negative advantage means this action is worse than average for that state. PPO decreases its probability by multiplying by a ratio < 1. This removes bad actions from the policy.",
    a: "✗ Incorrect. We never want to increase the probability of worse-than-average actions.",
    b: "✓ This is the right answer! Negative advantage → decrease probability.",
    c: "✗ Incorrect. If an action is worse than average, we should change it, not keep it the same."
  }
};

const quizzes = document.querySelectorAll(".quiz");
quizzes.forEach((quiz) => {
  const button = quiz.querySelector("[data-check]");
  const feedback = quiz.querySelector(".feedback");
  const answer = quiz.dataset.answer;
  const quizName = quiz.parentElement.querySelector("input[type=radio]").name; // e.g., "q1"

  button.addEventListener("click", () => {
    const choice = quiz.querySelector("input[type=radio]:checked");
    if (!choice) {
      feedback.innerHTML = "<span style='color: #f59e0b;'>⚠ Please select an answer first.</span>";
      feedback.style.marginTop = "12px";
      return;
    }

    const explanations = quizExplanations[quizName] || {};
    const isCorrect = choice.value === answer;

    if (isCorrect) {
      feedback.innerHTML = `<span style='color: #10b981; font-weight: 500;'>${explanations.correct || "✓ Correct!"}</span>`;
    } else {
      const selectedExpl = explanations[choice.value] || `✗ Incorrect. The correct answer is "${answer}". ${explanations.correct || "Review the concepts above."}`;
      feedback.innerHTML = `<span style='color: #ef4444; font-weight: 500;'>${selectedExpl}</span>`;
    }

    feedback.style.marginTop = "12px";
    feedback.style.padding = "12px";
    feedback.style.borderRadius = "6px";
    feedback.style.backgroundColor = isCorrect ? "#ecfdf5" : "#fef2f2";
    feedback.style.lineHeight = "1.6";
  });
});
