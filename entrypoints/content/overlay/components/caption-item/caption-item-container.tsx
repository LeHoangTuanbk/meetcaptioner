import type { Caption } from "@content/types";
import { CaptionItemView } from "./caption-item-view";
import { useCaptionItem } from "./use-caption-item";

type CaptionItemProps = {
  caption: Caption;
  translationEnabled: boolean;
};

export function CaptionItem({ caption, translationEnabled }: CaptionItemProps) {
  const viewModel = useCaptionItem(caption);

  return (
    <CaptionItemView
      caption={caption}
      translationEnabled={translationEnabled}
      viewModel={viewModel}
    />
  );
}
