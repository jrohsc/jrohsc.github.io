import React, { useId, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { RichText } from "./MathText";
import "./concept-diagram.css";

export function ConceptDiagram({ steps = [], title }) {
  const [active, setActive] = useState(0);
  const panelId = useId();
  if (!steps.length) return null;
  const step = steps[active] || steps[0];
  return (
    <figure className="mechanism" aria-label={`${title}: mechanism diagram`}>
      <div className="mechanism-header">
        <span>FOLLOW THE MECHANISM</span>
        <small>
          {active + 1} / {steps.length}
        </small>
      </div>
      <div
        className="mechanism-flow"
        style={{ "--steps": steps.length }}
        role="group"
        aria-label="Explanation steps"
      >
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <button
              type="button"
              className={
                active === i ? "mechanism-step active" : "mechanism-step"
              }
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              aria-controls={panelId}
            >
              <span className="mechanism-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <RichText>{s.label}</RichText>
            </button>
            {i < steps.length - 1 && (
              <ArrowRight
                className="mechanism-arrow"
                size={16}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <figcaption
        id={panelId}
        className="mechanism-explanation"
        aria-live="polite"
      >
        <div>
          <span className="eyebrow">STEP {active + 1}</span>
          <h3>
            <RichText>{step.label}</RichText>
          </h3>
          <RichText as="p">{step.detail}</RichText>
        </div>
        <div className="mechanism-controls">
          <button
            type="button"
            aria-label="Previous explanation step"
            disabled={active === 0}
            onClick={() => setActive(active - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next explanation step"
            disabled={active === steps.length - 1}
            onClick={() => setActive(active + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
