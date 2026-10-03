import { Fish, ArrowUpRight, Sparkles } from "lucide-react";
import type { LureRecommendation } from "../engine/lureRecommendations";
export default function LurePicks({ lures }: { lures: LureRecommendation[] }) {
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
        Your best bass picks for these conditions.
      </p>
      <div className="lure-list">
        {lures.map((lure, i) => (
          <article className={`lure lure-${i}`} key={lure.name}>
            <div className="lure-top">
              <span className="lure-art" aria-hidden="true">
                <Fish size={35} strokeWidth={1.4} />
                <span className="lure-hook" />
              </span>
              <div className="lure-title">
                <span className="lure-rank">
                  {i === 0 ? (
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
