import { NotifyOptions } from '@/entrypoints/background/notifier';
import { defineExtensionMessaging } from '@webext-core/messaging';
import { defineWindowMessaging } from '@webext-core/messaging/page';

export const GENERAL_MESSAGES = {
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
  OPEN_TAB: 'OPEN_TAB',
} as const;

export const EXT_MESSAGES = {
  ...GENERAL_MESSAGES,
} as const;

export type GeneralMessage = (typeof GENERAL_MESSAGES)[keyof typeof GENERAL_MESSAGES];

export type ExtensionMessage = (typeof EXT_MESSAGES)[keyof typeof EXT_MESSAGES];

interface ProtocolMap {
  SHOW_NOTIFICATION(payload: NotifyOptions): void;

  OPEN_TAB(payload: { url: string; options?: OpenPageOptions }): {
    success: boolean;
    message: string;
  };
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();

export const websiteMessenger = defineWindowMessaging<ProtocolMap>({
  namespace: 'CAPTURE_IT_MESSAGES',
});
