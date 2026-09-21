import type { ChangeEvent } from "react";
import type { ExportFormat } from "./export-session";

type Props = {
  onExport: (format: ExportFormat) => void;
};

const exportFormats = ["csv", "txt"] as const;

const isExportFormat = (value: string): value is ExportFormat =>
  exportFormats.some((format) => format === value);

export const ExportSelect = ({ onExport }: Props) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.currentTarget;
    if (isExportFormat(value)) onExport(value);
    event.currentTarget.value = "";
  };

  return (
    <div className="relative">
      <select
        aria-label="Export captions and translations"
        defaultValue=""
        onChange={handleChange}
        className="cursor-pointer appearance-none rounded-lg border-0 bg-emerald-600 py-2 pr-10 pl-4 text-sm text-white outline-none transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <option value="" disabled>
          Export
        </option>
        <option value="csv">CSV</option>
        <option value="txt">TXT</option>
      </select>
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white"
      >
        <path
          d="m4 6 4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};
