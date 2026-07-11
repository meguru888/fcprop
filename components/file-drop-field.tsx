"use client";

import { useId, useState } from "react";

export function FileDropField({
  name,
  accept,
  required,
  hint = "Click to upload, or drag a file here",
  defaultFileName,
}: {
  name: string;
  accept?: string;
  required?: boolean;
  hint?: string;
  defaultFileName?: string | null;
}) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(defaultFileName ?? null);

  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-3 text-sm text-ink-soft transition-colors hover:border-brand-400 hover:bg-brand-50/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-brand-600 transition-colors group-hover:border-brand-300">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 truncate">
        {fileName ? (
          <span className="font-medium text-ink">{fileName}</span>
        ) : (
          hint
        )}
      </span>
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}
