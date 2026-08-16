import { styled } from '@linaria/react';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { ScrollWrapperComponentInstanceContext } from '@/ui/utilities/scroll/states/contexts/ScrollWrapperComponentInstanceContext';
import { WhatsappMessageDayDivider } from '@/whatsapp/components/WhatsappMessageDayDivider';
import { WhatsappMessageBubble } from '@/whatsapp/components/WhatsappMessageBubble';
import { WhatsappPendingMessageBubble } from '@/whatsapp/components/WhatsappPendingMessageBubble';
import { WhatsappPendingMessagesReconciliationEffect } from '@/whatsapp/components/WhatsappPendingMessagesReconciliationEffect';
import { WhatsappScrollToBottomButton } from '@/whatsapp/components/WhatsappScrollToBottomButton';
import { WhatsappThreadAutoScrollEffect } from '@/whatsapp/components/WhatsappThreadAutoScrollEffect';
import { WhatsappThreadInitialScrollLayoutEffect } from '@/whatsapp/components/WhatsappThreadInitialScrollLayoutEffect';
import { type PendingWhatsappMessage } from '@/whatsapp/types/PendingWhatsappMessage';
import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';
import { getWhatsappThreadScrollWrapperInstanceId } from '@/whatsapp/utils/getWhatsappThreadScrollWrapperInstanceId';
import { groupWhatsappMessagesByDay } from '@/whatsapp/utils/groupWhatsappMessagesByDay';

const StyledScrollWrapperContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  position: relative;
  width: 100%;
`;

const StyledMessageListContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[4]};
`;

// Settled bubbles never change, so let the browser skip layout and paint for
// the ones scrolled out of view; 48px approximates a short message.
const StyledSettledMessage = styled.div`
  contain-intrinsic-size: auto 48px;
  content-visibility: auto;
`;

type WhatsappMessageListProps = {
  whatsappChatRecordId: string;
  isGroupChat: boolean;
  whatsappMessagesOldestFirst: WhatsappMessageRecord[];
  pendingWhatsappMessages: PendingWhatsappMessage[];
  isLoading: boolean;
  hasOlderWhatsappMessages: boolean;
  onLoadOlderWhatsappMessages: () => void;
  onPendingWhatsappMessagesReconciled: (clientIds: string[]) => void;
};

export const WhatsappMessageList = ({
  whatsappChatRecordId,
  isGroupChat,
  whatsappMessagesOldestFirst,
  pendingWhatsappMessages,
  isLoading,
  hasOlderWhatsappMessages,
  onLoadOlderWhatsappMessages,
  onPendingWhatsappMessagesReconciled,
}: WhatsappMessageListProps) => {
  const [isInitialScrollPending, setIsInitialScrollPending] = useState(true);

  const scrollWrapperInstanceId =
    getWhatsappThreadScrollWrapperInstanceId(whatsappChatRecordId);

  const dayGroups = useMemo(
    () => groupWhatsappMessagesByDay(whatsappMessagesOldestFirst),
    [whatsappMessagesOldestFirst],
  );

  // Cheap stand-in for "the thread grew": the auto-scroll effect only needs to
  // know that something was appended, not what.
  const threadContentSignature = `${whatsappMessagesOldestFirst.length}-${
    whatsappMessagesOldestFirst.at(-1)?.id ?? ''
  }-${pendingWhatsappMessages.length}`;

  const handleInitialScrollDone = useCallback(() => {
    setIsInitialScrollPending(false);
  }, []);

  // Only ever true for the first painted render of a conversation, so a later
  // refetch cannot yank a reader who has scrolled back into history.
  const shouldPerformInitialScroll =
    isInitialScrollPending &&
    (!isLoading || whatsappMessagesOldestFirst.length > 0);

  return (
    <ScrollWrapperComponentInstanceContext.Provider
      value={{ instanceId: scrollWrapperInstanceId }}
    >
      <WhatsappPendingMessagesReconciliationEffect
        pendingWhatsappMessages={pendingWhatsappMessages}
        whatsappMessages={whatsappMessagesOldestFirst}
        onPendingWhatsappMessagesReconciled={
          onPendingWhatsappMessagesReconciled
        }
      />
      <StyledScrollWrapperContainer
        style={{ visibility: isInitialScrollPending ? 'hidden' : 'visible' }}
      >
        <ScrollWrapper componentInstanceId={scrollWrapperInstanceId}>
          <StyledMessageListContent>
            {/* Rendered only once the thread is pinned to the bottom, so the
                sentinel cannot fire while the initial scroll is still moving. */}
            {hasOlderWhatsappMessages && !isInitialScrollPending && (
              <CustomResolverFetchMoreLoader
                loading={isLoading}
                onLastRowVisible={onLoadOlderWhatsappMessages}
              />
            )}
            {dayGroups.map((dayGroup) => (
              <Fragment key={dayGroup.dayKey}>
                <WhatsappMessageDayDivider dayDate={dayGroup.dayDate} />
                {dayGroup.whatsappMessages.map((whatsappMessage) => (
                  <StyledSettledMessage key={whatsappMessage.id}>
                    <WhatsappMessageBubble
                      whatsappMessage={whatsappMessage}
                      shouldShowSenderName={isGroupChat}
                    />
                  </StyledSettledMessage>
                ))}
              </Fragment>
            ))}
            {pendingWhatsappMessages.map((pendingWhatsappMessage) => (
              <WhatsappPendingMessageBubble
                key={pendingWhatsappMessage.clientId}
                pendingWhatsappMessage={pendingWhatsappMessage}
              />
            ))}
          </StyledMessageListContent>
          <WhatsappThreadInitialScrollLayoutEffect
            shouldPerformInitialScroll={shouldPerformInitialScroll}
            onInitialScrollDone={handleInitialScrollDone}
          />
          <WhatsappThreadAutoScrollEffect
            threadContentSignature={threadContentSignature}
          />
        </ScrollWrapper>
        <WhatsappScrollToBottomButton />
      </StyledScrollWrapperContainer>
    </ScrollWrapperComponentInstanceContext.Provider>
  );
};
