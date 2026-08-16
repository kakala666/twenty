import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

const getLinkedPersonFullName = (
  whatsappChat: Pick<WhatsappChatRecord, 'person'>,
): string => {
  const personName = whatsappChat.person?.name;

  if (!isDefined(personName)) {
    return '';
  }

  return [personName.firstName, personName.lastName]
    .filter(isNonEmptyString)
    .join(' ');
};

// Falls back through the identifiers WhatsApp actually populates: a synced chat
// may have no name, and a group may have no phone jid.
export const getWhatsappChatDisplayName = (
  whatsappChat: Pick<
    WhatsappChatRecord,
    'name' | 'person' | 'phoneJid' | 'chatId'
  >,
): string => {
  if (isNonEmptyString(whatsappChat.name)) {
    return whatsappChat.name;
  }

  const linkedPersonFullName = getLinkedPersonFullName(whatsappChat);

  if (isNonEmptyString(linkedPersonFullName)) {
    return linkedPersonFullName;
  }

  if (isNonEmptyString(whatsappChat.phoneJid)) {
    return whatsappChat.phoneJid.split('@')[0];
  }

  return whatsappChat.chatId.split('@')[0];
};
