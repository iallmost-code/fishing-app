import type { ScoreResult } from "../engine/fishingScore";
export default function ScoreReasons({ result }: { result: ScoreResult }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <span className="kicker">WHY THIS SCORE</span>
          <h3>Condition breakdown</h3>
        </div>
        <span className="score-pill">
          {result.score} · {result.label}
        </span>
      </div>
      <div className="reason-list">
        {result.reasons
          .filter((r) => r.impact !== 0)
          .map((reason) => (
            <div className="reason" key={reason.text}>
              <span>{reason.text}</span>
              <strong className={reason.impact >= 0 ? "positive" : "negative"}>
                {reason.impact >= 0 ? "+" : ""}
                {reason.impact}
              </strong>
            </div>
          ))}
      </div>
      <p className="fine-print">{result.unavailable.join(" · ")}</p>
      <p className="fine-print">
        Weather guides the plan. Habitat, water conditions, and fish behavior
        still matter.
      </p>
    </section>
  );
}
