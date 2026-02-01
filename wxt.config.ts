import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import removeConsole from 'vite-plugin-remove-console';
import { defineConfig } from 'wxt';
import toUtf8 from './scripts/vite-plugin-to-utf8';

// See https://wxt.dev/api/config.html

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons', '@wxt-dev/i18n/module'],
  srcDir: 'src',
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  vite: (configEnv: { mode: string }) => ({
    plugins:
      configEnv.mode === 'production'
        ? [removeConsole({ includes: ['log'] }), tailwindcss()]
        : [toUtf8(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Disable compression for easier debugging
      minify: configEnv.mode === 'production',
      sourcemap: false,
    },
  }),
  manifest: ({ browser, manifestVersion, mode, command }) => {
    const manifestBase: any = {
      name: '__MSG_appName__',
      description: '__MSG_appDescription__',
      default_locale: 'en',
      permissions: ['tabs', 'storage', 'activeTab', 'notifications'],
      options_ui: {
        page: 'opts.html',
        open_in_tab: true,
      },
    };
    if (browser !== 'firefox') {
      manifestBase.permissions.push('tabGroups');
    }
    if (browser === 'firefox') {
      manifestBase.browser_specific_settings = {
        gecko: {
          data_collection_permissions: {
            required: ['none'],
          },
        },
      };
    }
    if (mode === 'development') {
      manifestBase.key =
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1gIStuzmtlJx9myPcEdZVB6fN6HZ4RDB2FNbhhhd1Q8kopHP3uZioJmGAbZch13CNg4nwDLzkT/Iv+SuQ92r6wEYf14rwv0pyLvegLlTWcKvpG+XfJXMl0AT32Gj2tuOoMceEpNRXZzcPf2QTftX4Lm3Kzv3kmeaIzHps1ajkT18iagllKExzmiQVZjCw/t8NYcY5cdjKQRhQqDTDqv5HnVanucEWmDPMb+AlyHOqAYxDurSt/IX1C5TW/khkCU8Fahcnw50ppVgIVKT7OLtSKDDNlqbC4BWIFWu55S5UR/CZNEbyjDtxzLkfVTi8sov7ZOUCTjEvRwjNmwXbo8PZwIDAQAB';
    }

    return manifestBase;
  },
});
