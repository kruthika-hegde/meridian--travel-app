import { useEffect, useState } from "react";
import { searchFirstPhoto } from "../api/images";

/** Fetches a single representative photo for a search query. */
export function useImage(query) {
  const [state, setState] = useState({ status: "idle", photo: null });

  useEffect(() => {
    if (!query) {
      setState({ status: "idle", photo: null });
      return;
    }
    let cancelled = false;
    setState({ status: "loading", photo: null });

    searchFirstPhoto(query).then((photo) => {
      if (!cancelled) setState({ status: photo ? "success" : "empty", photo });
    });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return state;
}
