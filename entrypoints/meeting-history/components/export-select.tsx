import { ActionMenu, type ActionMenuItem } from "./action-menu";
import type { ExportFormat } from "./export-session";

type Props = {
  onExport: (format: ExportFormat) => void;
};

const exportItems: readonly ActionMenuItem<ExportFormat>[] = [
  { value: "csv", label: "CSV" },
  { value: "txt", label: "TXT" },
];

export const ExportSelect = ({ onExport }: Props) => (
  <ActionMenu
    label="Export"
    ariaLabel="Export captions and translations"
    items={exportItems}
    onSelect={onExport}
    buttonClassName="border border-transparent bg-(--mc-primary) hover:bg-(--mc-primary-hover) focus-visible:ring-2 focus-visible:ring-emerald-300"
  />
);
