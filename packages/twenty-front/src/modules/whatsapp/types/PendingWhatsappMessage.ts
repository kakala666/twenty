// A locally held bubble shown between the composer submit and the moment the
// server-created record reaches us over SSE.
export type PendingWhatsappMessage = {
  clientId: string;
  whatsappChatRecordId: string;
  text: string;
  createdAtIsoString: string;
  status: 'SENDING' | 'FAILED';
};
