import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type KeyboardEvent, useState } from 'react';
import { IconSend } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { TextArea } from '@/ui/input/components/TextArea';

const WHATSAPP_COMPOSER_MAX_ROWS = 6;

const StyledComposer = styled.div`
  align-items: flex-end;
  background: ${themeCssVariables.background.primary};
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: auto;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledTextAreaContainer = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
`;

type WhatsappComposerProps = {
  whatsappChatRecordId: string;
  isSending: boolean;
  isDisabled: boolean;
  onSubmit: (text: string) => void;
};

export const WhatsappComposer = ({
  whatsappChatRecordId,
  isSending,
  isDisabled,
  onSubmit,
}: WhatsappComposerProps) => {
  const { t } = useLingui();
  const [draftText, setDraftText] = useState('');

  const trimmedDraftText = draftText.trim();
  const canSubmit = trimmedDraftText !== '' && !isSending && !isDisabled;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit(trimmedDraftText);
    setDraftText('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    // Enter confirms an IME candidate rather than sending; without this guard
    // every Chinese or Japanese word would be sent half-composed.
    if (event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    handleSubmit();
  };

  return (
    <StyledComposer onKeyDown={handleKeyDown}>
      <StyledTextAreaContainer>
        <TextArea
          textAreaId={`whatsapp-composer-${whatsappChatRecordId}`}
          value={draftText}
          onChange={setDraftText}
          placeholder={t`Write a message`}
          disabled={isDisabled}
          maxRows={WHATSAPP_COMPOSER_MAX_ROWS}
        />
      </StyledTextAreaContainer>
      <IconButton
        Icon={IconSend}
        size="medium"
        variant="primary"
        accent="blue"
        disabled={!canSubmit}
        onClick={handleSubmit}
        ariaLabel={t`Send`}
      />
    </StyledComposer>
  );
};
