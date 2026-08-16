import { useEffect } from 'react';

import { type PendingWhatsappMessage } from '@/whatsapp/types/PendingWhatsappMessage';
import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';
import { getReconciledPendingWhatsappMessageClientIds } from '@/whatsapp/utils/getReconciledPendingWhatsappMessageClientIds';

type WhatsappPendingMessagesReconciliationEffectProps = {
  pendingWhatsappMessages: PendingWhatsappMessage[];
  whatsappMessages: WhatsappMessageRecord[];
  onPendingWhatsappMessagesReconciled: (clientIds: string[]) => void;
};

// Drops the optimistic bubble as soon as the server-created record shows up,
// which is the only signal we get: the send response carries no record id.
export const WhatsappPendingMessagesReconciliationEffect = ({
  pendingWhatsappMessages,
  whatsappMessages,
  onPendingWhatsappMessagesReconciled,
}: WhatsappPendingMessagesReconciliationEffectProps) => {
  useEffect(() => {
    const reconciledClientIds = getReconciledPendingWhatsappMessageClientIds({
      pendingWhatsappMessages,
      whatsappMessages,
    });

    if (reconciledClientIds.length > 0) {
      onPendingWhatsappMessagesReconciled(reconciledClientIds);
    }
  }, [
    pendingWhatsappMessages,
    whatsappMessages,
    onPendingWhatsappMessagesReconciled,
  ]);

  return null;
};
