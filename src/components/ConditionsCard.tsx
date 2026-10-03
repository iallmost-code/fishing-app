import {
  Gauge,
  Wind,
  Cloud,
  Sunrise,
  Sunset,
  CloudRain,
  Thermometer,
} from "lucide-react";
import {
  hpaToInHg,
  degreesToCompass,
  type WeatherSnapshot,
} from "../services/weather";
import { formatClock, formatNumber } from "../utils/format";
export default function ConditionsCard({
  weather,
}: {
  weather: WeatherSnapshot;
}) {
  const c = weather.current;
  const metrics = [
    {
      Icon: Gauge,
      label: "Pressure",
      value:
        c.pressureHpa === null
          ? "Unavailable"
          : formatNumber(hpaToInHg(c.pressureHpa), 2, " inHg"),
      color: "blue",
    },
    {
      Icon: Wind,
      label: "Wind",
      value:
        c.windMph === null
          ? "Unavailable"
          : `${formatNumber(c.windMph, 0, " mph")} ${degreesToCompass(c.windDirection)}`,
      color: "aqua",
    },
    {
      Icon: Cloud,
      label: "Cloud cover",
      value: formatNumber(c.cloudCover, 0, "%"),
      color: "purple",
    },
    {
      Icon: Thermometer,
      label: "Temperature",
      value: formatNumber(c.temperature, 0, "°F"),
      color: "coral",
    },
    {
      Icon: CloudRain,
      label: "Rain chance",
      value: formatNumber(c.precipitationChance, 0, "%"),
      color: "blue",
    },
  ];
  return (
    <section className="card conditions-card">
      <div className="section-head">
        <div>
          <span className="kicker">READ THE WATER</span>
          <h3>The little things matter.</h3>
        </div>
        <span className="section-icon aqua">
          <Wind size={20} />
        </span>
      </div>
      <div className="conditions-grid">
        {metrics.map(({ Icon, label, value, color }) => (
          <div className="condition" key={label}>
            <span className={`metric-icon ${color}`}>
              <Icon size={20} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="sun-track">
        <div>
          <Sunrise size={23} />
          <span>
            <small>SUNRISE</small>
            <strong>{formatClock(weather.sunrise, weather.timezone)}</strong>
          </span>
        </div>
        <span className="sun-arc" aria-hidden="true">
          <i />
        </span>
        <div>
          <span>
            <small>SUNSET</small>
            <strong>{formatClock(weather.sunset, weather.timezone)}</strong>
          </span>
          <Sunset size={23} />
        </div>
      </div>
    </section>
  );
}
