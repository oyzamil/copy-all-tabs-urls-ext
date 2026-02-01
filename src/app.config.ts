import { defineAppConfig } from 'wxt/utils/define-app-config';
import { ActiveFilter, CopyFormat } from './entrypoints/popup/components/Home';

export const config = {
  APP: {
    color: '#fd5b09',
    font: 'Poppins',
    storageBucket: 'copy-all-tabs-urls-ext-settings',
    extensionPage: 'https://softwebtuts.com/',
  },
  SETTINGS: {
    theme: 'light' as 'light' | 'dark' | 'system',
    isGroupingEnabled: false as boolean,
    isHidePinnedEnabled: false as boolean,
    currentWindowOnly: false as boolean,
    activeFilter: 'all' as ActiveFilter,
    selectedCopyFormat: 'plain' as CopyFormat,
    copyTitleEnabled: false as boolean,
    templates: {
      plain: '{URL}',
    },
  },
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
  },
  GUMROAD: {
    GUMROAD_PRODUCT_ID: '',
    GUMROAD_URL: '',
  },
};

export default defineAppConfig(config);

export type Settings = typeof config.SETTINGS;

declare module 'wxt/utils/define-app-config' {
  export interface WxtAppConfig {
    APP: typeof config.APP;
    SETTINGS: typeof config.SETTINGS;
    ROUTES: typeof config.ROUTES;
    GUMROAD: typeof config.GUMROAD;
  }
}
