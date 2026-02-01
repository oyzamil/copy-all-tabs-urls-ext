import { config } from '@/app.config';
import { openPage } from './openPage';

export default defineBackground(() => {
  try {
    if (import.meta.env.PROD) {
      browser.runtime.onInstalled.addListener((details) => {
        if (details.reason === 'install') {
          browser.tabs.create({
            url: `${config.APP.extensionPage}?event=${getPackageProp('name')}-install`,
          });
        }

        if (details.reason === 'update') {
          browser.tabs.create({
            url: `${config.APP.extensionPage}?event=${getPackageProp('name')}-update`,
          });
        }
      });
    }

    onMessage(GENERAL_MESSAGES.OPEN_TAB, async ({ data }) => {
      return openPage(data.url, data.options);
    });
  } catch (error) {
    console.error('Service Worker Error:', error);
  }
});
