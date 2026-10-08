import { MinusIcon, PlusIcon } from "@phosphor-icons/react";

type Props = {
  fontSize: number;
  isDecreaseDisabled: boolean;
  isIncreaseDisabled: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
};

const controlButtonClass =
  "flex size-4 cursor-pointer items-center justify-center border-0 bg-transparent text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25";

export const FontSizeControl = ({
  fontSize,
  isDecreaseDisabled,
  isIncreaseDisabled,
  onDecrease,
  onIncrease,
}: Props) => (
  <div
    className="flex h-8 shrink-0 items-center gap-1 overflow-hidden rounded-md border border-(--mc-overlay-control-border) bg-(--mc-overlay-control) px-2 py-1"
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
      <MinusIcon className="size-3" />
    </button>
    <span className="min-w-5 text-center text-sm font-medium tabular-nums text-white">
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
      <PlusIcon className="size-3" />
    </button>
  </div>
);
