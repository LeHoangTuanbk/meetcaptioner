type Props = {
  fontSize: number;
  isDecreaseDisabled: boolean;
  isIncreaseDisabled: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

const controlButtonClass =
  "flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25";

const MinusIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
    <path d="M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.75" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
    <path d="M3 8h10M8 3v10" fill="none" stroke="currentColor" strokeWidth="1.75" />
  </svg>
);

export const FontSizeControl = ({
  fontSize,
  isDecreaseDisabled,
  isIncreaseDisabled,
  onDecrease,
  onIncrease,
}: Props) => (
  <div
    className="flex shrink-0 items-center overflow-hidden rounded-md border border-white/15 bg-white/8"
    aria-label="Caption font size"
  >
    <button
      type="button"
      className={controlButtonClass}
      disabled={isDecreaseDisabled}
      aria-label="Decrease caption font size"
      title="Decrease font size"
      onClick={onDecrease}
    >
      <MinusIcon />
    </button>
    <span className="min-w-9 text-center text-[10px] tabular-nums text-white/70">
      {fontSize}px
    </span>
    <button
      type="button"
      className={controlButtonClass}
      disabled={isIncreaseDisabled}
      aria-label="Increase caption font size"
      title="Increase font size"
      onClick={onIncrease}
    >
      <PlusIcon />
    </button>
  </div>
);
