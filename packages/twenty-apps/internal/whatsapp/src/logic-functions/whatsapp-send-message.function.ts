import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { WHATSAPP_SEND_MESSAGE_FUNCTION_ID } from 'src/constants/universal-identifiers';
import { sendWhatsappMessage } from 'src/logic-functions/handlers/send-whatsapp-message';

const handler = async (event: RoutePayload): Promise<Response> => {
  const body = event.body as Record<string, unknown> | null;

  const result = await sendWhatsappMessage({
    chatId: (body?.chatId as string | undefined) ?? '',
    text: (body?.text as string | undefined) ?? '',
    ...(typeof body?.replyToExternalId === 'string'
      ? { replyToExternalId: body.replyToExternalId }
      : {}),
  });

  return new Response(result, {
    status: result.success ? 200 : (result.status ?? 400),
    headers: { 'Content-Type': 'application/json' },
  });
};

export default defineLogicFunction({
  universalIdentifier: WHATSAPP_SEND_MESSAGE_FUNCTION_ID,
  name: 'whatsapp-send-message',
  description: 'Sends a WhatsApp text message through WAHA and records it.',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: '/whatsapp/send',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
