import type { Caption } from "@content/types";
import { CaptionItemContainer } from "./caption-item";

type Props = {
  captions: Caption[];
  isCCEnabled: boolean;
  isMeetingEnded: boolean;
  isTranslationEnabled: boolean;
};

export const CaptionList = ({
  captions,
  isCCEnabled,
  isMeetingEnded,
  isTranslationEnabled,
}: Props) => {
  if (captions.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-2 px-3.5 py-2 text-center text-(--mc-overlay-text-primary,#fff)">
        {isMeetingEnded ? (
          <>
            <p className="text-[13px] leading-5">Meeting ended.</p>
            <p className="text-xs leading-4.5">
              Caption capturing has stopped.
            </p>
          </>
        ) : isCCEnabled ? (
          <>
            <p className="text-[13px] leading-5">You're all set!</p>
            <p className="text-xs leading-4.5">
              Start speaking to see captions
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] leading-5">Waiting for captions...</p>
            <p className="text-xs leading-4.5">
              Please, turn on CC in Google Meet.
            </p>
            <p className="text-xs leading-4.5">
              Press C to toggle captions in Google Meet.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {captions.map((caption) => (
        <CaptionItemContainer
          key={caption.id}
          caption={caption}
          isTranslationEnabled={isTranslationEnabled}
        />
      ))}
    </div>
  );
};
