import { Link } from "react-router-dom";
import { LocationControl } from "./LocationControl";
import "./Header.css";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__row">
        <Link to="/" className="site-header__brand">
          <span className="site-header__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M3 12 L21 5 L14 21 L11 13 L3 12 Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Meridian
        </Link>
        <nav className="site-header__nav" aria-label="Primary">
          <Link to="/">Explore</Link>
        </nav>
        <LocationControl />
      </div>
    </header>
  );
}
