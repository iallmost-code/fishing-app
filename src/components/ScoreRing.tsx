export default function ScoreRing({
  score,
  label,
  size = 112,
}: {
  score: number;
  label?: string;
  size?: number;
}) {
  return (
    <div
      className="score-ring"
      style={
        {
          "--score": `${score * 3.6}deg`,
          "--size": `${size}px`,
        } as React.CSSProperties
      }
      role="img"
      aria-label={`Fishing score ${score} out of 100${label ? `, ${label}` : ""}`}
    >
      <div className="score-core">
        <strong>{score}</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
