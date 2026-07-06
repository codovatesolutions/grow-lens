export default function ScoreRing({ score = 0, size = 160 }) {
  const p = Math.max(0, Math.min(100, score));
  const color = p >= 75 ? "text-primary" : p >= 50 ? "text-yellow-500" : "text-accent";
  return (
    <div
      className="score-ring rounded-full grid place-items-center"
      style={{ width: size, height: size, "--p": p }}
      data-testid="score-ring"
    >
      <div
        className="bg-background rounded-full grid place-items-center"
        style={{ width: size - 18, height: size - 18 }}
      >
        <div className="text-center">
          <div className={`font-display text-5xl font-black ${color}`}>{p}</div>
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mt-1">Score / 100</div>
        </div>
      </div>
    </div>
  );
}
