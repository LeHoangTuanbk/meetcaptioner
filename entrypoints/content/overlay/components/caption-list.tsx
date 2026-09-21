import type { Caption } from "@content/types";
import { CaptionItemContainer } from "./caption-item";

type Props = {
  captions: Caption[];
  isCCEnabled: boolean;
  isTranslationEnabled: boolean;
};

export const CaptionList = ({
  captions,
  isCCEnabled,
  isTranslationEnabled,
}: Props) => {
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
            Please, turn on CC in Google Meet.
            <br />
            Press C to toggle captions in Google Meet.
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
