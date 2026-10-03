import { Fish, ArrowUpRight, Sparkles } from "lucide-react";
import type { LureRecommendation } from "../engine/lureRecommendations";
import type { LurePlanStop } from "../engine/lurePlan";
import { formatClock } from "../utils/format";
export default function LurePicks({
  lures,
  plan,
  timezone,
}: {
  lures: LureRecommendation[];
  /** Rest-of-day plan; falls back to right-now picks when the day is over. */
  plan: LurePlanStop[];
  timezone: string;
}) {
  const items: (LureRecommendation & Partial<LurePlanStop>)[] = plan.length
    ? plan
    : lures;
  return (
    <section className="card lure-card">
      <div className="section-head">
        <div>
          <span className="kicker">MATCH THE MOMENT</span>
          <h3>What’s on the line?</h3>
        </div>
        <span className="section-icon orange">
          <Fish size={21} />
        </span>
      </div>
      <p className="section-description">
        {plan.length
          ? "What to throw and where, for the rest of today."
          : "Your best bass picks for these conditions."}
      </p>
      <div className="lure-list">
        {items.map((lure, i) => (
          <article
            className={`lure lure-${i % 3}`}
            key={lure.start ?? lure.name}
          >
            <div className="lure-top">
              <span className="lure-art" aria-hidden="true">
                <Fish size={35} strokeWidth={1.4} />
                <span className="lure-hook" />
              </span>
              <div className="lure-title">
                <span className="lure-rank">
                  {lure.period ? (
                    <>
                      {lure.prime && <Sparkles size={11} />}
                      {lure.prime ? "PRIME · " : ""}
                      {lure.period.toUpperCase()} ·{" "}
                      {formatClock(lure.start, timezone, true)}–
                      {formatClock(lure.end, timezone, true)}
                    </>
                  ) : i === 0 ? (
                    <>
                      <Sparkles size={11} />
                      TOP PICK
                    </>
                  ) : (
                    `PICK ${i + 1}`
                  )}
                </span>
                <h4>{lure.name}</h4>
                <span className="lure-color">
                  <i />
                  {lure.color}
                </span>
              </div>
              <ArrowUpRight className="lure-arrow" size={20} />
            </div>
            <p className="lure-target">{lure.target}</p>
            <div className="lure-retrieve">
              <b>WORK IT</b>
              <span>{lure.retrieve}</span>
            </div>
            <details className="lure-why">
              <summary>
                Why this works<span>+</span>
              </summary>
              <p>{lure.reason}</p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
