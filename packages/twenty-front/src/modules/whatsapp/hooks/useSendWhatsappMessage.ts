import { useCallback } from 'react';
import { useStore } from 'jotai';

import { ensureTokenRenewed } from '@/auth/utils/ensureTokenRenewed';
import {
  sendWhatsappMessageRequest,
  WhatsappSendRequestError,
  type SendWhatsappMessageRequestArgs,
} from '@/whatsapp/utils/sendWhatsappMessageRequest';

const HTTP_STATUS_UNAUTHORIZED = 401;

// The send route is plain `fetch`, so it misses Apollo's token-refresh link:
// a single 401 retry after renewal has to be done here.
export const useSendWhatsappMessage = () => {
  const store = useStore();

  const sendWhatsappMessage = useCallback(
    async (args: SendWhatsappMessageRequestArgs) => {
      try {
        await sendWhatsappMessageRequest(args);
      } catch (error) {
        const isUnauthorized =
          error instanceof WhatsappSendRequestError &&
          error.status === HTTP_STATUS_UNAUTHORIZED;

        if (!isUnauthorized || !(await ensureTokenRenewed(store))) {
          throw error;
        }

        await sendWhatsappMessageRequest(args);
      }
    },
    [store],
  );

  return { sendWhatsappMessage };
};
