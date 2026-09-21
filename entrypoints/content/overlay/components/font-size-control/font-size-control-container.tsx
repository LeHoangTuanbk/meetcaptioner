import { DEFAULT_CAPTION_FONT_SIZE } from "@/shared/constants";
import { CAPTION_FONT_SIZES } from "@content/constants";
import { saveOverlaySettings } from "@content/overlay/shared";
import { FontSizeControl } from "./font-size-control";

type Props = {
  fontSize: number;
};

export const FontSizeControlContainer = ({ fontSize }: Props) => {
  const requestedIndex = CAPTION_FONT_SIZES.findIndex(
    (availableSize) => availableSize === fontSize
  );
  const defaultIndex = CAPTION_FONT_SIZES.findIndex(
    (availableSize) => availableSize === DEFAULT_CAPTION_FONT_SIZE
  );
  const currentIndex = requestedIndex >= 0 ? requestedIndex : defaultIndex;
  const currentFontSize = CAPTION_FONT_SIZES[currentIndex];

  const handleDecrease = () => {
    const nextFontSize = CAPTION_FONT_SIZES[currentIndex - 1];
    if (nextFontSize) void saveOverlaySettings({ captionFontSize: nextFontSize });
  };

  const handleIncrease = () => {
    const nextFontSize = CAPTION_FONT_SIZES[currentIndex + 1];
    if (nextFontSize) void saveOverlaySettings({ captionFontSize: nextFontSize });
  };

  return (
    <FontSizeControl
      fontSize={currentFontSize}
      isDecreaseDisabled={currentIndex === 0}
      isIncreaseDisabled={currentIndex === CAPTION_FONT_SIZES.length - 1}
      onDecrease={handleDecrease}
      onIncrease={handleIncrease}
    />
  );
};
