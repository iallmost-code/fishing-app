/** Presentation only: never changes a calculated fishing score. */
export function scoreTone(
  score: number,
): "excellent" | "good" | "fair" | "poor" {
  return score >= 70
    ? "excellent"
    : score >= 50
      ? "good"
      : score >= 30
        ? "fair"
        : "poor";
}
