import { useEffect, useRef, useState } from "react";

type TranslationEditorProps = {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
};

export function TranslationEditor({ initialValue, onSave, onCancel }: TranslationEditorProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    resize();
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={1}
      onChange={(event) => {
        setValue(event.target.value);
        requestAnimationFrame(resize);
      }}
      onBlur={() => onSave(value.trim())}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      className="min-h-6 w-full resize-none overflow-hidden rounded border border-blue-400 bg-white/8 px-2 py-1 font-[inherit] text-[13px] leading-[1.45] text-blue-400 outline-none select-text"
    />
  );
}
