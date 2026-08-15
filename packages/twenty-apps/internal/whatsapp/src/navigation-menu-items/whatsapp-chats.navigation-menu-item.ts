import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHATS_NAVIGATION_MENU_ITEM_ID,
} from '../constants/universal-identifiers';

// Folder-less entry so the synced conversations are reachable right after
// install without any manual workspace setup.
export default defineNavigationMenuItem({
  universalIdentifier: WHATSAPP_CHATS_NAVIGATION_MENU_ITEM_ID,
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  icon: 'IconBrandWhatsapp',
  targetObjectUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
});
