import { useCallback } from 'react';
import { useStore } from 'jotai';

import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { pendingWhatsappMessagesByChatRecordIdState } from '@/whatsapp/states/pendingWhatsappMessagesByChatRecordIdState';
import { type PendingWhatsappMessage } from '@/whatsapp/types/PendingWhatsappMessage';

const EMPTY_PENDING_WHATSAPP_MESSAGES: PendingWhatsappMessage[] = [];

export const usePendingWhatsappMessages = (whatsappChatRecordId: string) => {
  const store = useStore();
  const pendingWhatsappMessagesByChatRecordId = useAtomStateValue(
    pendingWhatsappMessagesByChatRecordIdState,
  );

  const pendingWhatsappMessages =
    pendingWhatsappMessagesByChatRecordId[whatsappChatRecordId] ??
    EMPTY_PENDING_WHATSAPP_MESSAGES;

  // Written straight to the store so the send flow can update the queue from a
  // promise chain without depending on a re-rendered snapshot.
  const updatePendingWhatsappMessages = useCallback(
    (
      updateQueue: (
        previousQueue: PendingWhatsappMessage[],
      ) => PendingWhatsappMessage[],
    ) => {
      store.set(
        pendingWhatsappMessagesByChatRecordIdState.atom,
        (previousState) => ({
          ...previousState,
          [whatsappChatRecordId]: updateQueue(
            previousState[whatsappChatRecordId] ?? [],
          ),
        }),
      );
    },
    [store, whatsappChatRecordId],
  );

  const addPendingWhatsappMessage = useCallback(
    (pendingWhatsappMessage: PendingWhatsappMessage) => {
      updatePendingWhatsappMessages((previousQueue) => [
        ...previousQueue,
        pendingWhatsappMessage,
      ]);
    },
    [updatePendingWhatsappMessages],
  );

  const removePendingWhatsappMessages = useCallback(
    (clientIdsToRemove: string[]) => {
      if (clientIdsToRemove.length === 0) {
        return;
      }

      updatePendingWhatsappMessages((previousQueue) =>
        previousQueue.filter(
          (pendingWhatsappMessage) =>
            !clientIdsToRemove.includes(pendingWhatsappMessage.clientId),
        ),
      );
    },
    [updatePendingWhatsappMessages],
  );

  const markPendingWhatsappMessageAsFailed = useCallback(
    (clientId: string) => {
      updatePendingWhatsappMessages((previousQueue) =>
        previousQueue.map((pendingWhatsappMessage) =>
          pendingWhatsappMessage.clientId === clientId
            ? { ...pendingWhatsappMessage, status: 'FAILED' as const }
            : pendingWhatsappMessage,
        ),
      );
    },
    [updatePendingWhatsappMessages],
  );

  return {
    pendingWhatsappMessages,
    addPendingWhatsappMessage,
    removePendingWhatsappMessages,
    markPendingWhatsappMessageAsFailed,
  };
};
