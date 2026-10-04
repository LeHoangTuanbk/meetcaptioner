type WaveIndicatorProps = {
  active: boolean;
};

export function WaveIndicator({ active }: WaveIndicatorProps) {
  return (
    <div className="flex size-6.5 items-center justify-center gap-1" aria-label={active ? "Receiving captions" : "Idle"}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`w-1.5 origin-center rounded-full transition-colors ${
            active ? "mc-wave-bar-active bg-green-400" : "bg-white/30"
          }`}
          style={{
            animationDelay: `${index * 150}ms`,
            height: active ? `${[10, 18, 26][index]}px` : `${[10, 12, 12][index]}px`,
          }}
        />
      ))}
    </div>
  );
}
