import { createContext, useContext, useMemo, useState } from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  // { label, lat, lon, source: 'geolocation' | 'search' } | null
  const [location, setLocation] = useState(null);

  const value = useMemo(() => ({ location, setLocation }), [location]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within LocationProvider");
  return ctx;
}
