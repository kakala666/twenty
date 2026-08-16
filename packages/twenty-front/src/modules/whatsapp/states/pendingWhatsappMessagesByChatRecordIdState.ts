import { type PendingWhatsappMessage } from '@/whatsapp/types/PendingWhatsappMessage';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Keyed by whatsappChat record UUID so a send survives navigating to another
// conversation and back before the record arrives over SSE.
export const pendingWhatsappMessagesByChatRecordIdState = createAtomState<
  Record<string, PendingWhatsappMessage[]>
>({
  key: 'pendingWhatsappMessagesByChatRecordIdState',
  defaultValue: {},
});
