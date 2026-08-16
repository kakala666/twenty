import { type PendingWhatsappMessage } from '@/whatsapp/types/PendingWhatsappMessage';
import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';

// The server assigns `sentAt` from WhatsApp, which can run slightly behind the
// local clock, so a persisted message is allowed to look a little older than
// the optimistic bubble it replaces.
const WHATSAPP_SENT_AT_CLOCK_SKEW_IN_MS = 60_000;

export const getReconciledPendingWhatsappMessageClientIds = ({
  pendingWhatsappMessages,
  whatsappMessages,
}: {
  pendingWhatsappMessages: PendingWhatsappMessage[];
  whatsappMessages: WhatsappMessageRecord[];
}): string[] => {
  const outboundTexts = whatsappMessages
    .filter((whatsappMessage) => whatsappMessage.direction === 'OUTBOUND')
    .map((whatsappMessage) => ({
      text: (whatsappMessage.text ?? '').trim(),
      sentAtTimestamp: new Date(whatsappMessage.sentAt).getTime(),
    }));

  return pendingWhatsappMessages
    .filter((pendingWhatsappMessage) => {
      const createdAtTimestamp = new Date(
        pendingWhatsappMessage.createdAtIsoString,
      ).getTime();
      const pendingText = pendingWhatsappMessage.text.trim();

      return outboundTexts.some(
        (outboundText) =>
          outboundText.text === pendingText &&
          outboundText.sentAtTimestamp >=
            createdAtTimestamp - WHATSAPP_SENT_AT_CLOCK_SKEW_IN_MS,
      );
    })
    .map((pendingWhatsappMessage) => pendingWhatsappMessage.clientId);
};
