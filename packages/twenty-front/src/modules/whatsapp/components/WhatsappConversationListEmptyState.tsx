import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[4]};
  text-align: center;
`;

type WhatsappConversationListEmptyStateProps = {
  hasSearchText: boolean;
};

export const WhatsappConversationListEmptyState = ({
  hasSearchText,
}: WhatsappConversationListEmptyStateProps) => (
  <StyledEmptyState>
    {hasSearchText ? (
      <Trans>No conversation matches your search.</Trans>
    ) : (
      <Trans>No conversations yet.</Trans>
    )}
  </StyledEmptyState>
);
