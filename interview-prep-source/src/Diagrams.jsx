import React, { useState } from "react";
export function Diagram({ kind = "gradient" }) {
  const [v, setV] = useState(
    kind === "bayes" || kind === "attention" ? 10 : kind === "gradient" ? 20 : 45,
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
    label = "각도",
    min = 0,
    max = 90;
  if (kind === "pca") {
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
        {text(470, 285, "첫 번째 축으로 투영")}
      </>
    );
    caption =
      "축을 회전해 투영된 점들의 분산이 가장 커지는 방향을 찾아보세요. PCA는 중심화된 데이터에서 이 방향을 고릅니다.";
  } else if (kind === "gradient") {
    label = "학습률 × 100";
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
      "학습률을 높이면 진동이 커집니다. 이 이차 손실에서는 0 < η < 1일 때 수렴하고, η > 1이면 발산합니다.";
  } else if (kind === "bayes") {
    label = "사전확률 (%)";
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
      "민감도 90%, 위양성률 10%인 검사입니다. 양성이 나와도 사전확률이 낮으면 실제 양성의 사후확률은 낮을 수 있습니다.";
  } else if (kind === "bias") {
    label = "모델 복잡도";
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
        {text(290, 287, "모델 복잡도 →")}
        {text(435, 48, "검증 오차")}
        {text(447, 223, "훈련 오차")}
      </>
    );
    caption =
      "도식적인 예시입니다. 훈련 오차만으로 일반화 성능을 판단할 수 없습니다. 검증 곡선은 데이터와 정규화에 따라 달라집니다.";
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
      "고정된 점수 [2, 1, −1]에 temperature를 적용한 예시입니다. 작은 temperature는 분포를 뾰족하게 하고, 큰 값은 평탄하게 만듭니다.";
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
        {text(290, 65, "Forward: 입력 → 예측 → 손실")}
        {back && (
          <>
            {line(515, 215, 75, 215, "#c79059")}
            {text(290, 250, "Backward: ∂L/∂x = (∂L/∂y)(∂y/∂x) ←")}
          </>
        )}
      </>
    );
    caption =
      "각 연산의 국소 미분을 연결하면 파라미터별 손실의 기울기를 얻습니다. 여러 경로가 합쳐지는 노드에서는 기울기를 더합니다.";
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
    </figure>
  );
}
