import { useState } from "react";
import { LocateFixed, Search, MapPin, X } from "lucide-react";
import { searchLocations, type FishingLocation } from "../services/location";
import type { FishingConditions } from "../hooks/useFishingConditions";
import Sheet from "./Sheet";

export default function LocationSheet({
  conditions,
  onClose,
}: {
  conditions: FishingConditions;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<FishingLocation[] | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setResults(await searchLocations(query));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const locating = conditions.locationStatus === "locating";
  return (
    <Sheet title="Where are you fishing?" onClose={onClose}>
      <button
        className="primary-button wide"
        onClick={() => void conditions.useGPS().then((ok) => ok && onClose())}
        disabled={locating}
      >
        <LocateFixed size={20} />
        {locating ? "Finding you…" : "Use my GPS location"}
      </button>
      {conditions.locationError && (
        <p className="inline-error" role="status">
          {conditions.locationError}
        </p>
      )}
      <form className="search-row" onSubmit={search}>
        <label className="sr-only" htmlFor="location-query">
          Town or lake
        </label>
        <input
          id="location-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a town"
          enterKeyHint="search"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="clear"
            aria-label="Clear"
            onClick={() => {
              setQuery("");
              setResults(null);
            }}
          >
            <X size={18} />
          </button>
        )}
        <button disabled={busy || query.trim().length < 2} aria-label="Search">
          <Search size={20} />
        </button>
      </form>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {results?.length === 0 && <p className="muted">No towns found.</p>}
      <div className="result-list">
        {results?.map((p) => (
          <button
            className="result"
            key={`${p.latitude},${p.longitude}`}
            onClick={() => {
              void conditions.refresh(p);
              onClose();
            }}
          >
            <MapPin size={18} />
            {p.name}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
