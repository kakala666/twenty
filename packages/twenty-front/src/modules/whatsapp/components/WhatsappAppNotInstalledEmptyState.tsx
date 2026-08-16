import { Trans } from '@lingui/react/macro';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';

export const WhatsappAppNotInstalledEmptyState = () => (
  <AnimatedPlaceholderEmptyContainer>
    <AnimatedPlaceholder type="noRecord" />
    <AnimatedPlaceholderEmptyTextContainer>
      <AnimatedPlaceholderEmptyTitle>
        <Trans>WhatsApp is not installed</Trans>
      </AnimatedPlaceholderEmptyTitle>
      <AnimatedPlaceholderEmptySubTitle>
        <Trans>
          Install the WhatsApp app for this workspace to see your conversations
          here.
        </Trans>
      </AnimatedPlaceholderEmptySubTitle>
    </AnimatedPlaceholderEmptyTextContainer>
  </AnimatedPlaceholderEmptyContainer>
);
