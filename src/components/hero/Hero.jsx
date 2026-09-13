import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

const VIDEO_SRC = "/video/hero.mp4";

export function Hero() {
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className={`hero${videoFailed ? " hero--fallback" : ""}`} aria-label="Introduction">
      <div className="hero__media" aria-hidden="true">
        {!videoFailed && (
          <video
            ref={videoRef}
            className="hero__video"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
        )}
        <div className="hero__scrim" />
      </div>

      <div className="container hero__content">
        <p className="hero__eyebrow">Somewhere, right now</p>
        <h1 className="hero__headline">
          Go find out
          <br />
          what's actually there.
        </h1>
        <p className="hero__sub">
          Real-time weather, the places worth your time, and an assistant that
          can turn all of it into a plan — for anywhere you point it.
        </p>
        <Link to="/explore" className="hero__cta">
          Explore destinations
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}