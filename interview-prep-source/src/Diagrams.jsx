import React, { useState } from "react";
export function Diagram({ kind = "gradient" }) {
  const [v, setV] = useState(
    {
      bayes: 10,
      attention: 10,
      gradient: 20,
      entropy: 50,
      gaussian: 20,
      regression: 20,
      sigmoid: 0,
      expectation: 17,
      softmax: 20,
    }[kind] ?? 45,
  );
  const line = (x1, y1, x2, y2, color = "#b8c8bf", extra = {}) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth="2"
      {...extra}
    />
  );
  const text = (x, y, t) => (
    <text x={x} y={y} textAnchor="middle" fill="currentColor" fontSize="13">
      {t}
    </text>
  );
  let graphic,
    caption,
    label = "Angle",
    min = 0,
    max = 90;
  if (kind === "precision") {
    label = "Position between 1 and 2 (%)";
    min = 0;
    max = 100;
    const x = 1 + v / 100;
    const formats = [
      { name: "FP32", exponent: 8, fraction: 23, step: 2 ** -23 },
      { name: "FP16", exponent: 5, fraction: 10, step: 2 ** -10 },
      { name: "BF16", exponent: 8, fraction: 7, step: 2 ** -7 },
    ];
    graphic = (
      <>
        {formats.map((f, i) => {
          const y = 28 + i * 84,
            rounded = Math.round(x / f.step) * f.step;
          return (
            <g key={f.name}>
              {text(64, y + 19, f.name)}
              <rect
                x="112"
                y={y}
                width="14"
                height="27"
                rx="3"
                fill="#bd795d"
              />
              <rect
                x="129"
                y={y}
                width={f.exponent * 11}
                height="27"
                rx="3"
                fill="#49765d"
              />
              <rect
                x={132 + f.exponent * 11}
                y={y}
                width={f.fraction * 11}
                height="27"
                rx="3"
                fill="#a9b9da"
              />
              {text(
                310,
                y + 48,
                `1 sign + ${f.exponent} exponent + ${f.fraction} fraction bits`,
              )}
              {text(
                310,
                y + 67,
                `${x.toFixed(4)} → ${rounded.toFixed(7)}  (gap near 1: ${f.step.toExponential(2)})`,
              )}
            </g>
          );
        })}
        {text(290, 298, "Exponent = range · Fraction = precision")}
      </>
    );
    caption =
      "Move the slider to compare rounding in [1, 2]. BF16 has FP32's exponent width, but fewer fraction bits than FP16: wider range does not mean finer precision. These gaps are local; spacing grows with magnitude. Round-to-nearest is illustrated; midpoint tie rules do not affect the displayed slider values.";
  } else if (kind === "pca") {
    const a = (v * Math.PI) / 180,
      ux = Math.cos(a),
      uy = -Math.sin(a),
      pts = Array.from({ length: 23 }, (_, i) => [
        100 + i * 15,
        210 - i * 5 + Math.sin(i * 7) * 24,
      ]);
    graphic = (
      <>
        {line(60, 260, 530, 260)}
        {line(60, 260, 60, 35)}
        {line(
          290 - 230 * ux,
          150 - 230 * uy,
          290 + 230 * ux,
          150 + 230 * uy,
          "#28795a",
        )}
        {pts.map(([x, y], i) => {
          const dot = (x - 290) * ux + (y - 150) * uy,
            px = 290 + dot * ux,
            py = 150 + dot * uy;
          return (
            <g key={i}>
              {line(x, y, px, py, "#d1ded5", { strokeDasharray: "3 4" })}
              <circle cx={x} cy={y} r="4" fill="#d59b62" />
              <circle cx={px} cy={py} r="3" fill="#28795a" />
            </g>
          );
        })}
        {text(470, 285, "Projection onto the first axis")}
      </>
    );
    caption =
      "Rotate the axis to find the direction with the greatest projected variance. PCA finds this direction in centered data.";
  } else if (kind === "entropy") {
    label = "Probability of outcome A (%)";
    min = 1;
    max = 99;
    const entropy = (p) => -p * Math.log2(p) - (1 - p) * Math.log2(1 - p),
      p = v / 100;
    const points = Array.from({ length: 99 }, (_, i) => {
      const x = (i + 1) / 100;
      return `${60 + x * 480},${255 - entropy(x) * 180}`;
    }).join(" ");
    graphic = (
      <>
        {line(60, 255, 550, 255)}
        {line(60, 255, 60, 40)}
        <polyline
          points={points}
          fill="none"
          stroke="#327d5b"
          strokeWidth="3"
        />
        {line(
          60 + p * 480,
          255,
          60 + p * 480,
          255 - entropy(p) * 180,
          "#c79059",
          { strokeDasharray: "4 4" },
        )}
        <circle
          cx={60 + p * 480}
          cy={255 - entropy(p) * 180}
          r="6"
          fill="#c79059"
        />
        {text(300, 285, "Probability p →")}
        {text(300, 30, `H(p) = ${entropy(p).toFixed(3)} bits`)}
        {text(82, 58, "1 bit")}
      </>
    );
    caption =
      "For two possible outcomes, uncertainty is greatest when both have probability 0.5. When one outcome becomes almost certain, entropy approaches zero. Move the slider and compare certainty with the height of the curve.";
  } else if (kind === "gaussian") {
    label = "Standard deviation × 20";
    min = 5;
    max = 50;
    const sigma = v / 20;
    const points = Array.from({ length: 161 }, (_, i) => {
      const x = -4 + i / 20,
        p =
          Math.exp((-x * x) / (2 * sigma * sigma)) /
          (sigma * Math.sqrt(2 * Math.PI));
      return `${300 + x * 60},${255 - p * 100}`;
    }).join(" ");
    graphic = (
      <>
        {line(55, 255, 550, 255)}
        {line(300, 255, 300, 35, "#b8c8bf", { strokeDasharray: "4 4" })}
        <polyline
          points={points}
          stroke="#327d5b"
          strokeWidth="3"
          fill="none"
        />
        {text(300, 285, "Mean = 0")}
        {text(300, 30, `Standard deviation σ = ${sigma.toFixed(2)}`)}
        {text(72, 285, "−4")}
        {text(535, 285, "4")}
      </>
    );
    caption =
      "A Gaussian distribution spreads out as its standard deviation grows. Its peak becomes lower because the total area under the full density curve stays equal to one. The height is a density, not the probability of one exact value.";
  } else if (kind === "regression") {
    label = "Slope × 20";
    min = 0;
    max = 25;
    const slope = v / 20,
      ys = [0.5, 1.4, 2.1, 3.2, 3.7],
      mse =
        ys.reduce((sum, y, x) => sum + (y - (slope * x + 0.4)) ** 2, 0) /
        ys.length;
    graphic = (
      <>
        {line(55, 255, 550, 255)}
        {line(60, 255, 60, 35)}
        {line(70, 255 - 40 * 0.4, 470, 255 - 40 * (slope * 4 + 0.4), "#327d5b")}
        {ys.map((y, x) => (
          <g key={x}>
            {line(
              70 + 100 * x,
              255 - 40 * y,
              70 + 100 * x,
              255 - 40 * (slope * x + 0.4),
              "#c79059",
              { strokeWidth: 3 },
            )}
            <circle cx={70 + 100 * x} cy={255 - 40 * y} r="5" fill="#c79059" />
          </g>
        ))}
        {text(
          300,
          30,
          `ŷ = ${slope.toFixed(2)}x + 0.40 · MSE = ${mse.toFixed(3)}`,
        )}
        {text(300, 285, "Input x →")}
      </>
    );
    caption =
      "The green line is the prediction. Orange vertical segments are residuals: observed minus predicted values. Change the slope to shrink their average squared length. The intercept is held at 0.4 in this example.";
  } else if (kind === "sigmoid") {
    label = "Logit × 10";
    min = -60;
    max = 60;
    const sigmoid = (x) => 1 / (1 + Math.exp(-x)),
      x = v / 10,
      p = sigmoid(x);
    const points = Array.from({ length: 121 }, (_, i) => {
      const z = -6 + i / 10;
      return `${300 + z * 40},${250 - sigmoid(z) * 180}`;
    }).join(" ");
    graphic = (
      <>
        {line(55, 250, 550, 250)}
        {line(60, 160, 540, 160, "#b8c8bf", { strokeDasharray: "4 4" })}
        <polyline
          points={points}
          stroke="#327d5b"
          strokeWidth="3"
          fill="none"
        />
        <circle cx={300 + x * 40} cy={250 - p * 180} r="6" fill="#c79059" />
        {text(300, 30, `σ(${x.toFixed(1)}) = ${p.toFixed(3)}`)}
        {text(300, 285, "Logit →")}
        {text(45, 75, "1")}
        {text(38, 163, "0.5")}
        {text(45, 250, "0")}
      </>
    );
    caption =
      "Sigmoid turns a real-valued score into a number between zero and one. A score of zero maps to 0.5; very positive or negative scores approach one or zero. Being in this range does not by itself make a model well calibrated.";
  } else if (kind === "expectation") {
    label = "Probability of rolling a six (%)";
    min = 0;
    max = 100;
    const p = v / 100,
      prob = [...Array(5).fill((1 - p) / 5), p],
      mean = prob.reduce((s, p, i) => s + p * (i + 1), 0);
    graphic = (
      <>
        {line(50, 255, 550, 255)}
        {prob.map((p, i) => (
          <g key={i}>
            <rect
              x={65 + i * 80}
              y={255 - p * 190}
              width="45"
              height={p * 190}
              rx="4"
              fill={i === 5 ? "#c79059" : "#6d9877"}
            />
            {text(88 + i * 80, 279, String(i + 1))}
            {text(88 + i * 80, 241 - p * 190, p.toFixed(2))}
          </g>
        ))}
        {text(300, 30, `Expected value E[X] = ${mean.toFixed(2)}`)}
      </>
    );
    caption =
      "Expectation is a probability-weighted average. Here the first five die faces share the remaining probability equally. The average need not be a possible single outcome: it describes the long-run mean over repeated independent rolls.";
  } else if (kind === "softmax") {
    label = "First logit × 10";
    min = -30;
    max = 30;
    const logits = [v / 10, 1, -1],
      exps = logits.map((x) => Math.exp(x - Math.max(...logits))),
      sum = exps.reduce((a, b) => a + b, 0),
      p = exps.map((x) => x / sum);
    graphic = (
      <>
        {text(
          300,
          35,
          `Logits [${logits[0].toFixed(1)}, 1, −1] → probabilities`,
        )}
        {p.map((w, i) => (
          <g key={i}>
            <rect
              x="145"
              y={80 + i * 55}
              width={w * 340}
              height="28"
              rx="4"
              fill={i === 0 ? "#327d5b" : "#a7c4b1"}
            />
            {text(82, 100 + i * 55, `Class ${i + 1}`)}
            {text(530, 100 + i * 55, `${(w * 100).toFixed(1)}%`)}
          </g>
        ))}
        {text(300, 285, "Probabilities sum to 1")}
      </>
    );
    caption =
      "Softmax exponentiates each logit and divides by the sum. Increasing one logit increases its probability while reducing the others. Subtracting the maximum from every logit preserves these ratios and avoids overflow.";
  } else if (kind === "gradient") {
    label = "Learning rate × 100";
    min = 1;
    max = 105;
    let x = 3.8;
    const pts = [];
    for (let i = 0; i < 9; i++) {
      pts.push([290 + x * 50, 255 - x * x * 13]);
      x -= (v / 100) * 2 * x;
      if (Math.abs(x) > 4.2) break;
    }
    graphic = (
      <>
        {line(55, 260, 540, 260)}
        <path
          d="M90 47 Q290 460 490 47"
          fill="none"
          stroke="#a6b8ac"
          strokeWidth="3"
        />
        {pts.map(([x, y], i) => (
          <g key={i}>
            {i > 0 && line(...pts[i - 1], x, y, "#28795a")}
            <circle
              cx={x}
              cy={y}
              r={i === 0 ? 6 : 4}
              fill={i === 0 ? "#d59b62" : "#28795a"}
            />
          </g>
        ))}
        {text(290, 285, "θ →    L(θ) = θ²")}
        {text(290, 30, "θ ← θ − η · 2θ")}
      </>
    );
    caption =
      "A larger learning rate increases oscillation. For this quadratic loss, updates converge when 0 < η < 1 and diverge when η > 1.";
  } else if (kind === "bayes") {
    label = "Prior probability (%)";
    min = 1;
    max = 90;
    const prior = v / 100,
      post = (0.9 * prior) / (0.9 * prior + 0.1 * (1 - prior));
    graphic = (
      <>
        {[
          [110, prior, "Prior"],
          [290, 0.9, "Sensitivity"],
          [470, post, "Posterior"],
        ].map(([x, p, t]) => (
          <g key={t}>
            <rect
              x={x - 45}
              y="65"
              width="90"
              height="170"
              rx="9"
              fill="#edf0e9"
            />
            <rect
              x={x - 45}
              y={235 - p * 170}
              width="90"
              height={p * 170}
              rx="9"
              fill="#327d5b"
            />
            {text(x, 262, t)}
            {text(x, 48, `${Math.round(p * 100)}%`)}
          </g>
        ))}
      </>
    );
    caption =
      "The test has 90% sensitivity and a 10% false-positive rate. With a low prior probability, a positive result can still have a low posterior probability of being a true positive.";
  } else if (kind === "bias") {
    label = "Model complexity";
    min = 0;
    max = 100;
    const x = 80 + v * 4.2;
    graphic = (
      <>
        {line(60, 260, 540, 260)}
        {line(60, 260, 60, 35)}
        <path
          d="M70 70 C180 190 280 225 520 245"
          stroke="#28795a"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M70 60 Q280 320 520 75"
          stroke="#c79059"
          strokeWidth="3"
          fill="none"
        />
        {line(x, 45, x, 260, "#647c76", { strokeDasharray: "4 5" })}
        {text(290, 287, "Model complexity →")}
        {text(435, 48, "Validation error")}
        {text(447, 223, "Training error")}
      </>
    );
    caption =
      "This is a schematic example. Training error alone cannot establish generalization. The validation curve depends on the data and regularization.";
  } else if (kind === "attention") {
    label = "Temperature × 10";
    min = 1;
    max = 30;
    const logits = [2, 1, -1],
      es = logits.map((x) => Math.exp(x / (v / 10))),
      sum = es.reduce((a, b) => a + b),
      p = es.map((x) => x / sum);
    graphic = (
      <>
        {["QKᵀ / √d", "softmax", "Σ weight · V"].map((s, i) => (
          <g key={s}>
            <rect
              x={35 + i * 190}
              y="35"
              width="165"
              height="47"
              rx="8"
              fill="#edf0e9"
            />
            {text(117 + i * 190, 64, s)}
            {i < 2 && text(211 + i * 190, 63, "→")}
          </g>
        ))}
        {p.map((w, i) => (
          <g key={i}>
            <rect
              x="145"
              y={115 + i * 48}
              width={w * 340}
              height="26"
              rx="4"
              fill={i === 0 ? "#28795a" : "#a7c4b1"}
            />
            {text(84, 134 + i * 48, `token ${i + 1}`)}
            {text(510, 134 + i * 48, `${(w * 100).toFixed(1)}%`)}
          </g>
        ))}
      </>
    );
    caption =
      "Temperature is applied to fixed scores [2, 1, −1]. Lower temperatures sharpen the distribution; higher temperatures flatten it.";
  } else {
    const back = kind === "backprop";
    graphic = (
      <>
        {["x", "Wx + b", "activation", "loss"].map((s, i) => (
          <g key={s}>
            <rect
              x={20 + i * 145}
              y="105"
              width="120"
              height="70"
              rx="12"
              fill={i === 3 ? "#e7d8c4" : "#e1ede4"}
              stroke="#b8c8bf"
            />
            {text(80 + i * 145, 147, s)}
            {i < 3 && text(153 + i * 145, 147, "→")}
          </g>
        ))}
        {text(290, 65, "Forward: input → prediction → loss")}
        {back && (
          <>
            {line(515, 215, 75, 215, "#c79059")}
            {text(290, 250, "Backward: ∂L/∂x = (∂L/∂y)(∂y/∂x) ←")}
          </>
        )}
      </>
    );
    caption =
      "Chain together local derivatives to obtain the loss gradient for each parameter. Add gradients at nodes where multiple paths meet.";
  }
  return (
    <figure className="diagram">
      <svg viewBox="0 0 600 310" role="img" aria-label={caption}>
        {graphic}
      </svg>
      {!["network", "backprop"].includes(kind) && (
        <label className="range-label">
          {label} <strong>{v}</strong>
          <input
            aria-label={label}
            type="range"
            min={min}
            max={max}
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
          />
        </label>
      )}
      <figcaption>{caption}</figcaption>
      {kind === "precision" && (
        <div className="precision-table">
          <table>
            <caption>
              Range and local spacing — IEEE-style format values
            </caption>
            <thead>
              <tr>
                {[
                  "Format",
                  "Bits: sign / exponent / fraction",
                  "Largest finite",
                  "Smallest positive normal",
                  "Smallest positive subnormal",
                  "Gap above 1",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "FP32",
                  "1 / 8 / 23",
                  "≈ 3.403 × 10³⁸",
                  "≈ 1.175 × 10⁻³⁸",
                  "≈ 1.401 × 10⁻⁴⁵",
                  "2⁻²³",
                ],
                [
                  "FP16",
                  "1 / 5 / 10",
                  "65,504",
                  "≈ 6.104 × 10⁻⁵",
                  "≈ 5.960 × 10⁻⁸",
                  "2⁻¹⁰",
                ],
                [
                  "BF16",
                  "1 / 8 / 7",
                  "≈ 3.390 × 10³⁸",
                  "≈ 1.175 × 10⁻³⁸",
                  "≈ 9.184 × 10⁻⁴¹",
                  "2⁻⁷",
                ],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((v, i) =>
                    i === 0 ? (
                      <th scope="row" key={i}>
                        {v}
                      </th>
                    ) : (
                      <td key={i}>{v}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            Subnormal support and flushing to zero depend on the device and
            operation. Storage dtype, multiplication dtype, and accumulation
            dtype can differ.
          </p>
        </div>
      )}
    </figure>
  );
}
