import { Trans } from '@lingui/react/macro';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';

export const WhatsappNoChatSelectedEmptyState = () => (
  <AnimatedPlaceholderEmptyContainer>
    <AnimatedPlaceholder type="emptyInbox" />
    <AnimatedPlaceholderEmptyTextContainer>
      <AnimatedPlaceholderEmptyTitle>
        <Trans>No conversation selected</Trans>
      </AnimatedPlaceholderEmptyTitle>
      <AnimatedPlaceholderEmptySubTitle>
        <Trans>Pick a conversation on the left to read and reply.</Trans>
      </AnimatedPlaceholderEmptySubTitle>
    </AnimatedPlaceholderEmptyTextContainer>
  </AnimatedPlaceholderEmptyContainer>
);
