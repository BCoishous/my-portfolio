import { useEffect, useState } from "react";
import "./Hero.css";

const lines = ["Former automotive technician.", "Turned software developer."];

function Hero() {
  const [displayed, setDisplayed] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState("typing");
  const [showSub, setShowSub] = useState(false);

  useEffect(() => {
    const current = lines[lineIndex];

    if (phase === "typing") {
      if (charIndex < current.length) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        }, 45);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(
          () => setPhase("pause"),
          lineIndex === lines.length - 1 ? 800 : 1200,
        );
        return () => clearTimeout(t);
      }
    }

    if (phase === "pause") {
      if (lineIndex === lines.length - 1) {
        setPhase("done");
        setShowSub(true);
        return;
      }
      const t = setTimeout(() => setPhase("deleting"), 50);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (charIndex > 0) {
        const t = setTimeout(() => {
          setDisplayed(current.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        }, 25);
        return () => clearTimeout(t);
      } else {
        setLineIndex((i) => i + 1);
        setPhase("typing");
      }
    }
  }, [phase, charIndex, lineIndex]);

  return (
    <section id="hero" className="hero">
      <p className="hero-eyebrow">Brandon Coish</p>
      <h1 className="hero-headline">
        {phase === "done"
          ? lines.map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))
          : displayed}
        <span className="cursor" />
      </h1>
      <p className={`hero-sub ${showSub ? "visible" : ""}`}>
        I spent a decade diagnosing complex systems under pressure as an
        automotive technician. Turns out that way of thinking translates pretty
        well to code. Now I build full stack applications, work with AWS cloud
        infrastructure, and graduate from Keyin College in August 2026.
      </p>
      <div className={`hero-actions ${showSub ? "visible" : ""}`}>
        <a href="#projects" className="btn btn-primary">
          See my work
        </a>
        <a
          href="https://github.com/BCoishous"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/brandon-coish-"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          LinkedIn
        </a>
      </div>
    </section>
  );
}

export default Hero;
