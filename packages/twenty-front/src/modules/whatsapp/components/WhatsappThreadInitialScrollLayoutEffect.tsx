import { useLayoutEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { useScrollWrapperHTMLElement } from '@/ui/utilities/scroll/hooks/useScrollWrapperHTMLElement';
import { scrollWhatsappThreadToBottom } from '@/whatsapp/utils/scrollWhatsappThreadToBottom';

type WhatsappThreadInitialScrollLayoutEffectProps = {
  shouldPerformInitialScroll: boolean;
  onInitialScrollDone: () => void;
};

// Runs before paint, and once more on the next frame, so late layout (wrapped
// long messages) cannot leave the thread parked mid-history on open.
export const WhatsappThreadInitialScrollLayoutEffect = ({
  shouldPerformInitialScroll,
  onInitialScrollDone,
}: WhatsappThreadInitialScrollLayoutEffectProps) => {
  const { getScrollWrapperElement } = useScrollWrapperHTMLElement();

  useLayoutEffect(() => {
    if (!shouldPerformInitialScroll) {
      return;
    }

    const { scrollWrapperElement } = getScrollWrapperElement();

    if (!isDefined(scrollWrapperElement)) {
      return;
    }

    scrollWhatsappThreadToBottom(scrollWrapperElement);

    const animationFrameId = requestAnimationFrame(() => {
      const { scrollWrapperElement: settledScrollWrapperElement } =
        getScrollWrapperElement();

      if (isDefined(settledScrollWrapperElement)) {
        scrollWhatsappThreadToBottom(settledScrollWrapperElement);
      }

      onInitialScrollDone();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    shouldPerformInitialScroll,
    getScrollWrapperElement,
    onInitialScrollDone,
  ]);

  return null;
};
