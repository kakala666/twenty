import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { WhatsappAppInstalledGate } from '@/whatsapp/components/WhatsappAppInstalledGate';
import { WhatsappChatPageContent } from '@/whatsapp/components/WhatsappChatPageContent';

const PANEL_CORNER_RADIUS_DERIVED_FROM_THEME_SCALE = `calc(${themeCssVariables.border.radius.md} + ${themeCssVariables.spacing[1]})`;

const StyledPanel = styled.div`
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${PANEL_CORNER_RADIUS_DERIVED_FROM_THEME_SCALE} 0 0
    ${PANEL_CORNER_RADIUS_DERIVED_FROM_THEME_SCALE};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

export const WhatsappChatPage = () => (
  <StyledPanel>
    <WhatsappAppInstalledGate>
      <WhatsappChatPageContent />
    </WhatsappAppInstalledGate>
  </StyledPanel>
);
