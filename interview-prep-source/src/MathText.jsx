import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export const mathOptions = {
  throwOnError: false,
  trust: false,
  strict: "warn",
  output: "htmlAndMathml",
  maxSize: 12,
  maxExpand: 1000,
};
export function MathFormula({ latex, display = false }) {
  const html = useMemo(
    () =>
      katex.renderToString(String(latex || ""), {
        ...mathOptions,
        displayMode: display,
      }),
    [latex, display],
  );
  return (
    <span
      className={
        display ? "rendered-equation display-equation" : "rendered-equation"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
export function RichText({ children, as: Tag = "span", className = "" }) {
  if (typeof children !== "string")
    return <Tag className={className}>{children}</Tag>;
  const parts = children.split(/(\$\$[\s\S]+?\$\$|\$(?!\$)[^$\n]+?\$)/g);
  return (
    <Tag className={"rich-text " + className}>
      {parts.map((part, i) =>
        part.startsWith("$$") && part.endsWith("$$") ? (
          <MathFormula key={i} latex={part.slice(2, -2)} display />
        ) : part.startsWith("$") && part.endsWith("$") ? (
          <MathFormula key={i} latex={part.slice(1, -1)} />
        ) : (
          part
        ),
      )}
    </Tag>
  );
}
export function FormulaGuide({ formulas = [] }) {
  return (
    <div className="formula-guides">
      {formulas.map((formula, i) => (
        <article className="formula-card" key={i}>
          <div className="formula-number">
            EQUATION {String(i + 1).padStart(2, "0")}
          </div>
          <MathFormula latex={formula.latex} display />
          <div className="formula-reading">
            <h3>Read it in plain English</h3>
            <RichText as="p">{formula.explanation}</RichText>
          </div>
          <div className="symbol-glossary">
            <h4>What each symbol means</h4>
            <dl>
              {(formula.symbols || []).map((s, j) => (
                <div key={j}>
                  <dt>
                    <MathFormula latex={s.symbol} />
                  </dt>
                  <dd>
                    <RichText>{s.meaning}</RichText>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {formula.example && (
            <div className="formula-example">
              <h4>Try it with numbers</h4>
              <RichText as="p">{formula.example}</RichText>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
