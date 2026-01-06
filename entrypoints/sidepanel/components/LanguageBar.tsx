interface LanguageBarProps {
  onChangeClick: () => void;
  onClose: () => void;
}

export default function LanguageBar({
  onChangeClick,
  onClose,
}: LanguageBarProps) {
  return (
    <div className="mx-4 mb-4 flex items-center justify-between rounded-lg bg-[#4da8da] px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onChangeClick}
          className="font-semibold text-white transition-opacity hover:opacity-80"
        >
          CHANGE
        </button>
        <button
          onClick={onClose}
          className="ml-2 text-white transition-opacity hover:opacity-80"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
