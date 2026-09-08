import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Aurora from "../effects/Aurora/Aurora";
import "./Hero.css";

const typedWords = [
  "stock",
  "warehouses",
  "purchases",
  "sales",
];

function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    const currentWord = typedWords[wordIndex];

    let delay = 75;

    if (phase === "typing" && typedText === currentWord) {
      delay = 1500;
    }

    if (phase === "deleting") {
      delay = 42;
    }

    const timer = window.setTimeout(() => {
      if (phase === "typing") {
        if (typedText.length < currentWord.length) {
          setTypedText(
            currentWord.slice(0, typedText.length + 1)
          );
        } else {
          setPhase("deleting");
        }

        return;
      }

      if (phase === "deleting") {
        if (typedText.length > 0) {
          setTypedText(
            currentWord.slice(0, typedText.length - 1)
          );
        } else {
          setWordIndex(
            (index) => (index + 1) % typedWords.length
          );

          setPhase("typing");
        }
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typedText, phase, wordIndex]);

  return (
    <section
      className="inventory-hero"
      aria-labelledby="hero-title"
    >
      <div
        className="inventory-hero-aurora"
        aria-hidden="true"
      >
        <Aurora />
      </div>

      <div
        className="inventory-hero-overlay"
        aria-hidden="true"
      />

      <div className="inventory-hero-content">

        <div className="inventory-hero-heading-wrap">

          <h1 id="hero-title">

            <span className="inventory-hero-line">
              Run the operation.
            </span>

            <span className="inventory-hero-line inventory-hero-track">
              <span>Track&nbsp;</span>

              <span className="inventory-hero-word">
                <span className="inventory-hero-typed">
                  {typedText}
                </span>

                <span
                  className="inventory-hero-cursor"
                  aria-hidden="true"
                />
              </span>
            </span>

          </h1>

        </div>

        <div className="inventory-hero-lower">

          <p className="inventory-hero-description">
            Products, stock, warehouses, purchasing, sales and
            teams — connected in one clear operational system.
          </p>

          <div className="inventory-hero-actions">

            <Link
              to="/register"
              className="inventory-hero-primary"
            >
              Build your workspace
            </Link>

            <a
              href="#features"
              className="inventory-hero-secondary"
            >
              See how it works
            </a>

          </div>

        </div>

      </div>
    </section>
  );
}

export default Hero;