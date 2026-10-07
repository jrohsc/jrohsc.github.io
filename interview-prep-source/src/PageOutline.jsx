import React, { useEffect, useState, useRef } from "react";
import { ArrowUp, PanelLeftClose } from "lucide-react";
export function PageOutline({ route }) {
  const [sections, setSections] = useState([]),
    [active, setActive] = useState(""),
    [progress, setProgress] = useState(0);
  const current = useRef([]);
  useEffect(() => {
    const content = document.querySelector(".page-content");
    if (!content) return;
    let frame = 0;
    const scan = () => {
      const explicit = [...content.querySelectorAll("[data-section]")];
      const headings = [...content.querySelectorAll("h2")].filter(
        (el) =>
          !el.closest(
            "[data-section],.study-grid,.company-grid,.track-grid,.question-list,.mock-result,.formula-card",
          ),
      );
      const nodes = [...explicit, ...headings].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
      const list = nodes
        .filter((el) => el.getClientRects().length)
        .map((el, i) => {
          const label =
            el.getAttribute("data-section") || el.textContent.trim();
          const id = "section-" + i;
          el.id = id;
          el.setAttribute("tabindex", "-1");
          return { id, label, element: el };
        })
        .filter((x) => x.label);
      current.current = list;
      setSections((old) =>
        JSON.stringify(old.map((x) => [x.id, x.label])) ===
        JSON.stringify(list.map((x) => [x.id, x.label]))
          ? old
          : list,
      );
      updateActive();
    };
    const updateActive = () => {
      let id = current.current[0]?.id || "";
      for (const s of current.current)
        if (s.element.getBoundingClientRect().top <= 150) id = s.id;
      setActive(id);
      const total = document.documentElement.scrollHeight - innerHeight;
      setProgress(
        total > 0 ? Math.min(100, Math.round((scrollY / total) * 100)) : 100,
      );
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    observer.observe(content, { childList: true, subtree: true });
    frame = requestAnimationFrame(scan);
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [route]);
  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    el.focus({ preventScroll: true });
    setActive(id);
  };
  return (
    <aside className="page-outline">
      <nav aria-label="On this page">
        <div className="outline-title">ON THIS PAGE</div>
        <div className="outline-links">
          {sections.map((s, i) => (
            <button
              key={s.id}
              className={active === s.id ? "active" : ""}
              aria-current={active === s.id ? "location" : undefined}
              onClick={() => jump(s.id)}
            >
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </button>
          ))}
          {sections.length === 0 && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Overview
            </button>
          )}
        </div>
        <div className="outline-progress">
          <span>Reading progress</span>
          <strong>{progress}%</strong>
          <div>
            <i style={{ width: progress + "%" }} />
          </div>
        </div>
        <button
          className="outline-top"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            document
              .getElementById("main-content")
              ?.focus({ preventScroll: true });
          }}
        >
          <ArrowUp size={13} /> Back to top
        </button>
      </nav>
    </aside>
  );
}
