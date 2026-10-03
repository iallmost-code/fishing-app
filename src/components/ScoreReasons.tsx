import type { ScoreResult } from "../engine/fishingScore";
export default function ScoreReasons({ result }: { result: ScoreResult }) {
  return (
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
      <p className="fine-print">
        Weather only. Water temperature, clarity and fish behavior still matter.
      </p>
    </div>
  );
}
