import { Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Home } from "./pages/Home";
import { DestinationDetail } from "./pages/DestinationDetail";
import { NotFound } from "./pages/NotFound";
import { LocationProvider } from "./context/LocationContext";

export default function App() {
  return (
    <LocationProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/destinations/:id" element={<DestinationDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </LocationProvider>
  );
}
