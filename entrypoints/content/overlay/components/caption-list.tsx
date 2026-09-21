import type { Caption } from "@content/types";
import { CaptionItem } from "./caption-item";

type CaptionListProps = {
  captions: Caption[];
  isCCEnabled: boolean;
  translationEnabled: boolean;
};

export function CaptionList({ captions, isCCEnabled, translationEnabled }: CaptionListProps) {
  if (captions.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs leading-6 text-slate-500">
        {isCCEnabled ? (
          <>
            You're all set!
            <br />
            Start speaking to see captions
          </>
        ) : (
          <>
            Waiting for captions...
            <br />
            Please, turn on CC in Google Meet
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {captions.map((caption) => (
        <CaptionItem key={caption.id} caption={caption} translationEnabled={translationEnabled} />
      ))}
    </div>
  );
}
