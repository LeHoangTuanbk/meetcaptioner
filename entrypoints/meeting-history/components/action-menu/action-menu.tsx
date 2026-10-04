import { CaretDownIcon } from "@phosphor-icons/react";
import { useActionMenu } from "./use-action-menu";

export type ActionMenuItem<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  label: string;
  ariaLabel: string;
  items: readonly ActionMenuItem<T>[];
  buttonClassName: string;
  isDisabled?: boolean;
  onSelect: (value: T) => void;
};

export const ActionMenu = <T extends string>({
  label,
  ariaLabel,
  items,
  buttonClassName,
  isDisabled = false,
  onSelect,
}: Props<T>) => {
  const { containerRef, isOpen, toggle, close } = useActionMenu();

  const handleSelect = (value: T) => {
    close();
    onSelect(value);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={toggle}
        className={`flex h-9 cursor-pointer items-center gap-2 rounded-lg py-2 pr-3 pl-4 text-sm font-medium text-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonClassName}`}
      >
        {label}
        <CaretDownIcon
          aria-hidden="true"
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 min-w-full overflow-hidden rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-surface-solid) py-1 shadow-[0_8px_15px_rgba(0,0,0,0.45)]"
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(item.value)}
              className="block w-full cursor-pointer px-4 py-2 text-left text-sm whitespace-nowrap text-(--mc-app-text) transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
