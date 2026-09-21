import type { RefObject } from "react";

type ResizeHandlesProps = {
  bottomRightRef: RefObject<HTMLDivElement | null>;
  bottomLeftRef: RefObject<HTMLDivElement | null>;
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function ResizeHandles({ bottomRightRef, bottomLeftRef, bottomRef }: ResizeHandlesProps) {
  return (
    <>
      <div ref={bottomRightRef} className="group absolute right-1 bottom-1 size-4 cursor-nwse-resize opacity-40 hover:opacity-90">
        <span className="absolute right-0.5 bottom-0.5 h-0.5 w-2 rounded bg-white/50" />
        <span className="absolute right-0.5 bottom-0.5 h-2 w-0.5 rounded bg-white/50" />
      </div>
      <div ref={bottomLeftRef} className="group absolute bottom-1 left-1 size-4 cursor-nesw-resize opacity-40 hover:opacity-90">
        <span className="absolute bottom-0.5 left-0.5 h-0.5 w-2 rounded bg-white/50" />
        <span className="absolute bottom-0.5 left-0.5 h-2 w-0.5 rounded bg-white/50" />
      </div>
      <div ref={bottomRef} className="absolute bottom-1 left-1/2 h-4 w-10 -translate-x-1/2 cursor-ns-resize opacity-40 hover:opacity-90">
        <span className="absolute bottom-1 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded bg-white/40" />
      </div>
    </>
  );
}
