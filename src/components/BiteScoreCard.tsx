import { ArrowUpRight, Sparkles, CircleCheck } from "lucide-react";
import type { ScoreResult } from "../engine/fishingScore";
import { scoreTone } from "../utils/presentation";
import { scrollToSection } from "../utils/scroll";
export default function BiteScoreCard({ score }: { score: ScoreResult }) {
  const tone = scoreTone(score.score);
  return (
    <section
      className={`score-panel tone-${tone}`}
      aria-label={`Fishing score ${score.score} out of 100, ${score.label}`}
    >
      <div className="score-copy">
        <span className="eyebrow">
          <Sparkles size={12} />
          TODAY’S BITE CHECK
        </span>
        <h2>
          {score.score >= 85
            ? "Looking reel good."
            : score.score >= 70
              ? "Good time to cast."
              : score.score >= 50
                ? "There’s a bite out there."
                : "Slow down. Fish smart."}
        </h2>
        <span className="score-label">
          <CircleCheck size={13} />
          {score.label} conditions
        </span>
        <button
          className="score-explain"
          onClick={() => scrollToSection("score-explanation")}
        >
          Why this score
          <ArrowUpRight size={13} />
        </button>
      </div>
      <div
        className="score-ring"
        style={{ "--score": `${score.score * 3.6}deg` } as React.CSSProperties}
      >
        <div className="score-core">
          <strong>{score.score}</strong>
          <span>OUT OF 100</span>
        </div>
      </div>
    </section>
  );
}
