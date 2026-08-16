import { getIsCookieAuthActive } from '@/apollo/utils/getIsCookieAuthActive';
import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { WHATSAPP_SEND_ENDPOINT_PATH } from '@/whatsapp/constants/WhatsappSendEndpointPath';
import { isDefined } from 'twenty-shared/utils';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

export class WhatsappSendRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'WhatsappSendRequestError';
    this.status = status;
  }
}

export type SendWhatsappMessageRequestArgs = {
  // The WhatsApp chat id string (`chatId` on the record), never the record UUID.
  whatsappChatExternalId: string;
  text: string;
  replyToExternalId?: string;
  signal?: AbortSignal;
};

export const sendWhatsappMessageRequest = async ({
  whatsappChatExternalId,
  text,
  replyToExternalId,
  signal,
}: SendWhatsappMessageRequestArgs): Promise<void> => {
  // Bearer takes precedence over the session cookie server-side, so attaching
  // it while cookie auth is active would bypass the CSRF origin check.
  const isCookieAuthActive = getIsCookieAuthActive();
  const token = getTokenPair()?.accessOrWorkspaceAgnosticToken?.token;
  const shouldAttachBearerToken = !isCookieAuthActive && isDefined(token);

  const response = await fetch(
    `${REACT_APP_SERVER_BASE_URL}${WHATSAPP_SEND_ENDPOINT_PATH}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(shouldAttachBearerToken
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body: JSON.stringify({
        chatId: whatsappChatExternalId,
        text,
        ...(isDefined(replyToExternalId) ? { replyToExternalId } : {}),
      }),
      signal,
    },
  );

  if (!response.ok) {
    throw new WhatsappSendRequestError(
      response.status,
      `WhatsApp send failed with status ${response.status}`,
    );
  }
};
