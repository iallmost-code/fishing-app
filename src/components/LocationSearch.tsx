import { useState } from "react";
import { LocateFixed, Search, MapPin } from "lucide-react";
import {
  searchLocations,
  MONROE_FALLBACK,
  type FishingLocation,
} from "../services/location";
import type { FishingConditions } from "../hooks/useFishingConditions";
export default function LocationSearch({
  conditions,
}: {
  conditions: FishingConditions;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<FishingLocation[]>([]),
    [busy, setBusy] = useState(false),
    [searched, setSearched] = useState(false),
    [error, setError] = useState("");
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSearched(false);
    try {
      setResults(await searchLocations(query));
      setSearched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card location-search">
      <div className="section-head">
        <div>
          <span className="kicker">YOUR WATER</span>
          <h3>Choose a location</h3>
        </div>
        <MapPin size={22} />
      </div>
      <p className="muted">
        GPS is optional. Precise coordinates stay in this session.
      </p>
      <button
        className="primary-button"
        onClick={() => void conditions.useGPS()}
        disabled={conditions.locationStatus === "locating"}
      >
        <LocateFixed size={18} />
        {conditions.locationStatus === "locating"
          ? "Finding your location…"
          : "Use my GPS location"}
      </button>
      {conditions.locationError && (
        <p role="status" className="inline-error">
          {conditions.locationError}
        </p>
      )}
      <form className="location-form" onSubmit={search}>
        <label className="sr-only" htmlFor="location-query">
          Town or city
        </label>
        <input
          id="location-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a town or city"
        />
        <button
          disabled={busy || query.trim().length < 2}
          aria-label="Search locations"
        >
          <Search size={18} />
          {busy ? "Searching…" : "Search"}
        </button>
      </form>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {searched && results.length === 0 && (
        <p>No matching towns found. Try another name.</p>
      )}
      {results.map((p) => (
        <button
          className="location-result"
          key={`${p.latitude},${p.longitude}`}
          onClick={() => {
            void conditions.refresh(p);
            setResults([]);
            setQuery("");
            setSearched(false);
          }}
        >
          <MapPin size={16} />
          {p.name}
        </button>
      ))}
      <button
        className="text-button"
        onClick={() => void conditions.refresh(MONROE_FALLBACK)}
      >
        Use Monroe, Georgia fallback
      </button>
    </section>
  );
}
