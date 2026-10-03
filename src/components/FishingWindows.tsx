import { Sunrise, Sunset } from "lucide-react";
import type { FishingWindow } from "../engine/fishingWindows";
import { formatClock } from "../utils/format";
export default function FishingWindows({
  windows,
  timezone,
}: {
  windows: FishingWindow[];
  timezone: string;
}) {
  return (
    <div className="window-list">
      {windows.length ? (
        windows.map((w, i) => (
          <article
            className={`bite-window ${i === 0 ? "primary" : ""}`}
            key={w.start}
          >
            {i === 0 ? <Sunset size={25} /> : <Sunrise size={25} />}
            <div>
              <span className="kicker">
                {i === 0 ? "PRIMARY WINDOW" : "SECONDARY WINDOW"}
              </span>
              <strong>
                {formatClock(w.start, timezone)} –{" "}
                {formatClock(w.end, timezone)}
              </strong>
              <small>
                Average score {w.averageScore} · Peak {w.peakScore}
              </small>
            </div>
          </article>
        ))
      ) : (
        <div className="empty-window">
          <strong>No strong continuous window</strong>
          <p>
            Two consecutive strong hours are needed. Check individual hours for
            the best opportunity.
          </p>
        </div>
      )}
      <p className="fine-print">
        Estimated from hourly conditions. Times are hourly boundaries, not
        minute-level predictions.
      </p>
    </div>
  );
}
