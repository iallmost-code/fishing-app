import {
  House,
  Map,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  Fish,
} from "lucide-react";
export type AppTab = "Home" | "Map" | "Forecast" | "Tackle" | "Catches";
const tabs = [
  { name: "Home", Icon: House },
  { name: "Map", Icon: Map },
  { name: "Forecast", Icon: ChartNoAxesCombined },
  { name: "Tackle", Icon: BriefcaseBusiness },
  { name: "Catches", Icon: Fish },
] as const;
export default function Navigation({
  tab,
  onChange,
}: {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map(({ name, Icon }) => (
        <button
          key={name}
          className={name === tab ? "active" : ""}
          aria-current={name === tab ? "page" : undefined}
          onClick={() => onChange(name)}
        >
          <Icon size={22} />
          <span>{name}</span>
        </button>
      ))}
    </nav>
  );
}
