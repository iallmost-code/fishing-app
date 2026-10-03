import { useMemo, useState } from "react";
import type { WeatherSnapshot } from "../services/weather";
import { hpaToInHg } from "../services/weather";
import { classifyPressure, pressureAt } from "../engine/pressureAnalysis";
import { formatClock, formatNumber } from "../utils/format";
export default function PressureChart({
  weather,
}: {
  weather: WeatherSnapshot;
}) {
  const now = Date.parse(weather.current.time);
  const points = useMemo(() => {
    const p = weather.hourly
      .filter(
        (h) =>
          Date.parse(h.time) >= now - 12 * 3600000 &&
          Date.parse(h.time) <= now + 12 * 3600000 &&
          h.pressureHpa !== null,
      )
      .map((h) => ({ time: h.time, pressure: h.pressureHpa! }));
    if (weather.current.pressureHpa !== null) {
      const i = p.findIndex((h) => h.time === weather.current.time);
      if (i >= 0) p[i].pressure = weather.current.pressureHpa;
      else
        p.push({
          time: weather.current.time,
          pressure: weather.current.pressureHpa,
        });
    }
    return p.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  }, [weather]);
  const [selection, setSelection] = useState<string | null>(null);
  const selectedIndex = Math.max(
    0,
    points.findIndex((p) => p.time === (selection ?? weather.current.time)),
  );
  const selected = points[selectedIndex];
  if (points.length < 2 || !selected)
    return (
      <section className="card">
        <h3>Barometric pressure</h3>
        <p>
          Pressure history is unavailable. The chart needs at least two real
          readings.
        </p>
      </section>
    );
  const start = now - 12 * 3600000,
    end = now + 12 * 3600000;
  const min = Math.min(...points.map((p) => hpaToInHg(p.pressure))) - 0.025,
    max = Math.max(...points.map((p) => hpaToInHg(p.pressure))) + 0.025;
  const x = (t: string) => 52 + ((Date.parse(t) - start) / (end - start)) * 580;
  const y = (p: number) => 160 - ((hpaToInHg(p) - min) / (max - min)) * 130;
  const selectedTrend = pressureAt(
    weather.hourly,
    selected.time,
    selected.pressure,
  );
  const historyHours = (now - Date.parse(points[0].time)) / 3600000;
  return (
    <section className="card pressure-chart">
      <div className="section-head">
        <div>
          <span className="kicker">12 HOURS BACK · 12 HOURS AHEAD</span>
          <h3>Barometric pressure</h3>
        </div>
        <span className="trend-badge">
          {classifyPressure(
            pressureAt(
              weather.hourly,
              weather.current.time,
              weather.current.pressureHpa,
            ).rate,
          )}
        </span>
      </div>
      <div className="chart-readout" aria-live="polite">
        <strong>
          {formatNumber(hpaToInHg(selected.pressure), 2, " inHg")}
        </strong>
        <span>
          {selected.time === weather.current.time
            ? "Now"
            : formatClock(selected.time, weather.timezone)}{" "}
          · {selectedTrend.label}
        </span>
      </div>
      <svg
        viewBox="0 0 660 210"
        role="img"
        aria-label="Interactive barometric pressure chart. Drag the slider below to inspect each hour."
      >
        {[0, 0.5, 1].map((f) => {
          const value = min + (max - min) * f,
            yy = 160 - f * 130;
          return (
            <g key={f}>
              <line x1="52" x2="632" y1={yy} y2={yy} stroke="#dbeef9" />
              <text x="43" y={yy + 4} textAnchor="end" className="chart-label">
                {value.toFixed(2)}
              </text>
            </g>
          );
        })}
        <rect
          x={x(weather.current.time)}
          y="20"
          width={632 - x(weather.current.time)}
          height="150"
          fill="#eaf7ff"
        />
        {points.slice(1).map((p, i) => {
          const previous = points[i],
            elapsed =
              (Date.parse(p.time) - Date.parse(previous.time)) / 3600000;
          if (elapsed > 1.1) return null;
          const trend = classifyPressure(
            (p.pressure - previous.pressure) / elapsed,
          );
          return (
            <line
              key={p.time}
              x1={x(previous.time)}
              y1={y(previous.pressure)}
              x2={x(p.time)}
              y2={y(p.pressure)}
              className={`pressure-line ${trend.includes("Falling") ? "falling" : trend.includes("Rising") ? "rising" : "stable"}`}
              strokeDasharray={Date.parse(p.time) > now ? "5 3" : undefined}
            />
          );
        })}
        <line
          x1={x(weather.current.time)}
          x2={x(weather.current.time)}
          y1="15"
          y2="175"
          stroke="#12679c"
          strokeDasharray="3 4"
        />
        <text
          x={x(weather.current.time)}
          y="195"
          textAnchor="middle"
          className="chart-label"
        >
          NOW
        </text>
        {points.map((p) => (
          <circle
            key={p.time}
            cx={x(p.time)}
            cy={y(p.pressure)}
            r={p.time === selected.time ? 6 : 3}
            fill={p.time === selected.time ? "#ffad31" : "#168ccd"}
            onPointerEnter={() => setSelection(p.time)}
            onClick={() => setSelection(p.time)}
          >
            <title>
              {formatClock(p.time, weather.timezone)} ·{" "}
              {hpaToInHg(p.pressure).toFixed(2)} inHg
            </title>
          </circle>
        ))}
        <text x="52" y="195" className="chart-label">
          −12h
        </text>
        <text x="632" y="195" textAnchor="end" className="chart-label">
          +12h
        </text>
      </svg>
      <label className="chart-slider-label" htmlFor="pressure-hour">
        Explore pressure by hour
      </label>
      <input
        id="pressure-hour"
        className="chart-slider"
        type="range"
        min="0"
        max={points.length - 1}
        value={selectedIndex}
        onChange={(e) => setSelection(points[Number(e.target.value)].time)}
        aria-valuetext={`${formatClock(selected.time, weather.timezone)}, ${hpaToInHg(selected.pressure).toFixed(2)} inHg, ${selectedTrend.label}`}
      />
      <div className="chart-legend">
        <span>
          <i className="falling" />
          Falling / Rapidly Falling
        </span>
        <span>
          <i className="stable" />
          Stable
        </span>
        <span>
          <i className="rising" />
          Rising / Rapidly Rising
        </span>
      </div>
      {historyHours < 11.5 && (
        <p className="fine-print">
          Only {Math.max(0, Math.floor(historyHours))} hours of real history are
          available. Missing readings are not interpolated.
        </p>
      )}
      <p className="fine-print">
        Solid: recent model history · Dashed: forecast · Sea-level pressure. One
        factor in the fishing score.
      </p>
    </section>
  );
}
