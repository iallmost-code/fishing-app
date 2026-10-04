import { Fish } from "lucide-react";
import type { CurrentLurePicks } from "../engine/currentLures";
import { formatClock } from "../utils/format";

export default function LurePicks({
  advice,
  timezone,
  conditionsTime,
  stale,
}: {
  advice: CurrentLurePicks;
  timezone: string;
  conditionsTime: string;
  stale: boolean;
}) {
  return (
    <section
      className="card lure-card"
      aria-label="Two lure options for right now"
    >
      <div className="section-head">
        <div>
          <span className="kicker">
            {advice.period.toUpperCase()} · {formatClock(advice.time, timezone)}
          </span>
          <h3>What to throw right now.</h3>
        </div>
        <span className="section-icon orange">
          <Fish size={21} />
        </span>
      </div>
      <div className="current-lure-list">
        {advice.picks.map((lure, i) => (
          <article className={`current-lure current-lure-${i}`} key={lure.name}>
            <span className="current-lure-rank">
              {i === 0 ? "START WITH THIS" : "BACKUP OPTION"}
            </span>
            <h4>{lure.name}</h4>
            <div className="current-lure-color">
              <span>COLOR</span>
              <strong>{lure.color}</strong>
            </div>
            <p className="current-lure-when">{lure.when}</p>
            <details className="current-lure-why">
              <summary>How to fish it</summary>
              <dl className="current-lure-method">
                <div>
                  <dt>Where</dt>
                  <dd>{lure.target}</dd>
                </div>
                <div>
                  <dt>Retrieve</dt>
                  <dd>{lure.retrieve}</dd>
                </div>
              </dl>
              <p>
                <strong>Why: </strong>
                {lure.reason}
              </p>
            </details>
          </article>
        ))}
      </div>
      <p className="fine-print">
        {stale || advice.outdatedWeather ? "Previous conditions" : "Conditions"}{" "}
        from {formatClock(conditionsTime, timezone)}.
        {advice.limitedWeather
          ? " Weather is limited; refresh for the latest conditions."
          : " Water clarity and water temperature are not supplied."}
      </p>
    </section>
  );
}
