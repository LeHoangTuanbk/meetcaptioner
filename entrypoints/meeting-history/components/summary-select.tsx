import type { ChangeEvent } from "react";
import { SelectChevron } from "./select-chevron";
import type { SummaryAction } from "./summary-prompt";

type Props = {
  isDisabled: boolean;
  onSelect: (action: SummaryAction) => void;
};

const summaryActions = ["copy", "chatgpt"] as const;

const isSummaryAction = (value: string): value is SummaryAction =>
  summaryActions.some((action) => action === value);

export const SummarySelect = ({ isDisabled, onSelect }: Props) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.currentTarget;
    if (isSummaryAction(value)) onSelect(value);
    event.currentTarget.value = "";
  };

  return (
    <div className="relative">
      <select
        aria-label="Summarize meeting"
        defaultValue=""
        disabled={isDisabled}
        onChange={handleChange}
        className="cursor-pointer appearance-none rounded-lg border border-slate-600 bg-slate-700 py-2 pr-10 pl-4 text-sm text-white outline-none transition-colors hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>
          Summary
        </option>
        <option value="copy">Copy prompt</option>
        <option value="chatgpt">Summarize with ChatGPT</option>
      </select>
      <SelectChevron />
    </div>
  );
};
