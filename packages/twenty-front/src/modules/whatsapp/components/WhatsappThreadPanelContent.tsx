import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { v4 as uuidv4 } from 'uuid';

import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { WhatsappComposer } from '@/whatsapp/components/WhatsappComposer';
import { WhatsappMessageList } from '@/whatsapp/components/WhatsappMessageList';
import { WhatsappMessagesSSESubscribeEffect } from '@/whatsapp/components/WhatsappMessagesSSESubscribeEffect';
import { WhatsappThreadHeader } from '@/whatsapp/components/WhatsappThreadHeader';
import { usePendingWhatsappMessages } from '@/whatsapp/hooks/usePendingWhatsappMessages';
import { useSendWhatsappMessage } from '@/whatsapp/hooks/useSendWhatsappMessage';
import { useWhatsappMessages } from '@/whatsapp/hooks/useWhatsappMessages';
import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';

const StyledThread = styled.div`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`;

type WhatsappThreadPanelContentProps = {
  whatsappChat: WhatsappChatRecord;
  onWhatsappMessageSent: () => void;
};

export const WhatsappThreadPanelContent = ({
  whatsappChat,
  onWhatsappMessageSent,
}: WhatsappThreadPanelContentProps) => {
  const { t } = useLingui();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [isSending, setIsSending] = useState(false);

  const whatsappChatRecordId = whatsappChat.id;
  // The send API keys conversations by the WhatsApp chat id string, which is a
  // different value from the Twenty record UUID used everywhere else here.
  const whatsappChatExternalId = whatsappChat.chatId;

  const {
    whatsappMessagesOldestFirst,
    loading,
    hasOlderWhatsappMessages,
    fetchMoreWhatsappMessages,
    refetchWhatsappMessages,
  } = useWhatsappMessages(whatsappChatRecordId);

  const {
    pendingWhatsappMessages,
    addPendingWhatsappMessage,
    removePendingWhatsappMessages,
    markPendingWhatsappMessageAsFailed,
  } = usePendingWhatsappMessages(whatsappChatRecordId);

  const { sendWhatsappMessage } = useSendWhatsappMessage();

  const handleWhatsappMessagesChanged = useCallback(() => {
    void refetchWhatsappMessages();
    onWhatsappMessageSent();
  }, [refetchWhatsappMessages, onWhatsappMessageSent]);

  const handleSubmit = (text: string) => {
    if (!isNonEmptyString(whatsappChatExternalId)) {
      enqueueErrorSnackBar({
        message: t`This conversation cannot be replied to.`,
      });
      return;
    }

    const clientId = uuidv4();

    addPendingWhatsappMessage({
      clientId,
      whatsappChatRecordId,
      text,
      createdAtIsoString: new Date().toISOString(),
      status: 'SENDING',
    });

    setIsSending(true);

    void sendWhatsappMessage({ whatsappChatExternalId, text })
      .then(() => {
        // The record is created server-side and normally arrives over SSE, but
        // a refetch closes the gap if the stream is momentarily down.
        void refetchWhatsappMessages();
        onWhatsappMessageSent();
      })
      .catch(() => {
        markPendingWhatsappMessageAsFailed(clientId);
        enqueueErrorSnackBar({ message: t`Could not send the message.` });
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  return (
    <StyledThread>
      <WhatsappMessagesSSESubscribeEffect
        whatsappChatRecordId={whatsappChatRecordId}
        onWhatsappMessagesChanged={handleWhatsappMessagesChanged}
      />
      <WhatsappThreadHeader whatsappChat={whatsappChat} />
      <WhatsappMessageList
        whatsappChatRecordId={whatsappChatRecordId}
        isGroupChat={whatsappChat.isGroup}
        whatsappMessagesOldestFirst={whatsappMessagesOldestFirst}
        pendingWhatsappMessages={pendingWhatsappMessages}
        isLoading={loading}
        hasOlderWhatsappMessages={hasOlderWhatsappMessages}
        onLoadOlderWhatsappMessages={fetchMoreWhatsappMessages}
        onPendingWhatsappMessagesReconciled={removePendingWhatsappMessages}
      />
      <WhatsappComposer
        whatsappChatRecordId={whatsappChatRecordId}
        isSending={isSending}
        isDisabled={!isDefined(whatsappChatExternalId)}
        onSubmit={handleSubmit}
      />
    </StyledThread>
  );
};
