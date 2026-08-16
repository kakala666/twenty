import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconArrowDown } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useScrollWrapperHTMLElement } from '@/ui/utilities/scroll/hooks/useScrollWrapperHTMLElement';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { whatsappThreadIsScrolledToBottomComponentSelector } from '@/whatsapp/states/selectors/whatsappThreadIsScrolledToBottomComponentSelector';
import { scrollWhatsappThreadToBottom } from '@/whatsapp/utils/scrollWhatsappThreadToBottom';

const StyledScrollToBottomButton = styled.button<{ isVisible: boolean }>`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  bottom: ${themeCssVariables.spacing[3]};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 32px;
  justify-content: center;
  left: 50%;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  pointer-events: ${({ isVisible }) => (isVisible ? 'auto' : 'none')};
  position: absolute;
  transform: translateX(-50%);
  width: 32px;
  z-index: 1;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

export const WhatsappScrollToBottomButton = () => {
  const { t } = useLingui();
  const isScrolledToBottom = useAtomComponentSelectorValue(
    whatsappThreadIsScrolledToBottomComponentSelector,
  );

  const { getScrollWrapperElement } = useScrollWrapperHTMLElement();

  const handleClick = () => {
    const { scrollWrapperElement } = getScrollWrapperElement();

    if (isDefined(scrollWrapperElement)) {
      scrollWhatsappThreadToBottom(scrollWrapperElement);
    }
  };

  return (
    <StyledScrollToBottomButton
      isVisible={!isScrolledToBottom}
      onClick={handleClick}
      aria-label={t`Scroll to latest message`}
    >
      <IconArrowDown size={16} />
    </StyledScrollToBottomButton>
  );
};
