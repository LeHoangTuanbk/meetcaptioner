import { ActionMenu, type ActionMenuItem } from "./action-menu";
import type { SummaryAction } from "./summary-prompt";

type Props = {
  isDisabled: boolean;
  onSelect: (action: SummaryAction) => void;
};

const summaryItems: readonly ActionMenuItem<SummaryAction>[] = [
  { value: "copy", label: "Copy prompt" },
  { value: "chatgpt", label: "Summarize with ChatGPT" },
];

export const SummarySelect = ({ isDisabled, onSelect }: Props) => (
  <ActionMenu
    label="Summary"
    ariaLabel="Summarize meeting"
    items={summaryItems}
    isDisabled={isDisabled}
    onSelect={onSelect}
    buttonClassName="border border-(--mc-app-field-border) bg-(--mc-secondary) hover:bg-(--mc-secondary-hover) focus-visible:ring-2 focus-visible:ring-slate-400"
  />
);
