import { House, MapPinned, ChartNoAxesCombined } from "lucide-react";
export const TABS = ["Today", "Spots", "Forecast"] as const;
export type AppTab = (typeof TABS)[number];
const icons = { Today: House, Spots: MapPinned, Forecast: ChartNoAxesCombined };
export default function Navigation({
  tab,
  onChange,
}: {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map((name) => {
        const Icon = icons[name];
        return (
          <button
            key={name}
            className={`nav-${name.toLowerCase()} ${name === tab ? "active" : ""}`}
            aria-current={name === tab ? "page" : undefined}
            onClick={() => onChange(name)}
          >
            <span className="nav-icon">
              <Icon size={21} />
            </span>
            <span>{name}</span>
          </button>
        );
      })}
    </nav>
  );
}
