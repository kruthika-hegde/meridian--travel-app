import { useRef, useState } from "react";
import "./Hero.css";

// Placeholder — swap for a downloaded royalty-free clip (see README "Hero video").
// Point this at a file in /public/video/ once you've picked one from Coverr or Mixkit;
// don't ship a hotlinked third-party URL to production.
const VIDEO_SRC = "/video/hero.mp4";

export function Hero({ onExplore }) {
  const videoRef = useRef(null);
  // If the clip 404s or fails to decode, fall back to a plain gradient rather
  // than a broken video frame — a real "failed request" state, not decoration.
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
        <button type="button" className="hero__cta" onClick={onExplore}>
          Explore destinations
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="hero__scroll-cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
