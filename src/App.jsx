import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { LoadingState } from "./components/common/StatusStates";
import { LocationProvider } from "./context/LocationContext";

// Route-level code splitting: each page ships as its own chunk, loaded on
// demand, instead of bloating the initial bundle with every page up front.
const Home = lazy(() => import("./pages/Home").then((m) => ({ default: m.Home })));
const DestinationDetail = lazy(() =>
  import("./pages/DestinationDetail").then((m) => ({ default: m.DestinationDetail }))
);
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

export default function App() {
  return (
    <LocationProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Suspense fallback={<LoadingState label="Loading…" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/destinations/:id" element={<DestinationDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </LocationProvider>
  );
}
