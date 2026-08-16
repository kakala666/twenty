import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { useScrollWrapperHTMLElement } from '@/ui/utilities/scroll/hooks/useScrollWrapperHTMLElement';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { whatsappThreadIsScrolledToBottomComponentSelector } from '@/whatsapp/states/selectors/whatsappThreadIsScrolledToBottomComponentSelector';
import { scrollWhatsappThreadToBottom } from '@/whatsapp/utils/scrollWhatsappThreadToBottom';

type WhatsappThreadAutoScrollEffectProps = {
  // Changes whenever the rendered thread grows; the value itself is opaque.
  threadContentSignature: string;
};

export const WhatsappThreadAutoScrollEffect = ({
  threadContentSignature,
}: WhatsappThreadAutoScrollEffectProps) => {
  const isScrolledToBottom = useAtomComponentSelectorValue(
    whatsappThreadIsScrolledToBottomComponentSelector,
  );

  const { getScrollWrapperElement } = useScrollWrapperHTMLElement();

  useEffect(() => {
    // The scroll position is only recorded on scroll events, so this still
    // reflects where the reader was before the new message was appended.
    if (!isScrolledToBottom) {
      return;
    }

    const { scrollWrapperElement } = getScrollWrapperElement();

    if (isDefined(scrollWrapperElement)) {
      scrollWhatsappThreadToBottom(scrollWrapperElement);
    }
  }, [threadContentSignature, isScrolledToBottom, getScrollWrapperElement]);

  return null;
};
