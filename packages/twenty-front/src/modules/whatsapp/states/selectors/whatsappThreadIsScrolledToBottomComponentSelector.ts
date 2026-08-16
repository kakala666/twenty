import { ScrollWrapperComponentInstanceContext } from '@/ui/utilities/scroll/states/contexts/ScrollWrapperComponentInstanceContext';
import { scrollWrapperScrollBottomComponentState } from '@/ui/utilities/scroll/states/scrollWrapperScrollBottomComponentState';
import { createAtomComponentSelector } from '@/ui/utilities/state/jotai/utils/createAtomComponentSelector';
import { WHATSAPP_SCROLL_BOTTOM_THRESHOLD_IN_PX } from '@/whatsapp/constants/WhatsappScrollBottomThresholdInPx';

export const whatsappThreadIsScrolledToBottomComponentSelector =
  createAtomComponentSelector<boolean>({
    key: 'whatsappThreadIsScrolledToBottomComponentSelector',
    componentInstanceContext: ScrollWrapperComponentInstanceContext,
    get:
      ({ instanceId }) =>
      ({ get }) => {
        const scrollBottom = get(scrollWrapperScrollBottomComponentState, {
          instanceId,
        });

        return scrollBottom <= WHATSAPP_SCROLL_BOTTOM_THRESHOLD_IN_PX;
      },
  });
