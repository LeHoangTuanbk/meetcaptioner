import type { Caption } from "@content/types";
import { CheckCircleIcon, ClosedCaptioningIcon } from "@phosphor-icons/react";
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
            <CheckCircleIcon className="size-6" weight="regular" aria-hidden="true" />
            <p className="text-2xl leading-7 font-semibold">You're all set!</p>
            <p className="text-xs leading-normal">Start speaking to see captions</p>
          </>
        ) : (
          <>
            <p className="text-2xl leading-7 font-semibold">Waiting for captions...</p>
            <div className="flex items-center justify-center gap-1.5 text-xs leading-normal">
              <span>Please, turn on</span>
              <ClosedCaptioningIcon className="size-6 shrink-0" weight="regular" aria-hidden="true" />
              <span>in Google Meet.</span>
            </div>
            <p className="text-xs leading-normal">
              Press <strong className="font-bold">C</strong> to toggle captions in Google Meet.
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
