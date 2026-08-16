import { useDoObjectMetadataItemsExist } from '@/object-metadata/hooks/useDoObjectMetadataItemsExist';
import { WHATSAPP_OBJECT_NAME_SINGULARS } from '@/whatsapp/constants/WhatsappObjectNameSingulars';

// `useObjectMetadataItem` throws when an object is absent from the workspace,
// so every WhatsApp hook must sit behind a parent that early-returns on this.
export const useIsWhatsappAppInstalled = (): boolean =>
  useDoObjectMetadataItemsExist(WHATSAPP_OBJECT_NAME_SINGULARS);
