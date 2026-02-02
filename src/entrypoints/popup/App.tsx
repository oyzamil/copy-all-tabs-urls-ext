import { BarsIcon, ChatIcon, MoonIcon, SettingsIcon, SunIcon } from '@/icons';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Dropdown, Space } from 'antd';
import Home from './components/Home';

export default function App() {
  return (
    <ThemeProvider>
      <Body>
        <Home />
      </Body>
    </ThemeProvider>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="h-full flex-1 overflow-y-auto p-2">{children}</main>
    </>
  );
}

export function Header() {
  const { settings, saveSettings } = useSettings();

  const items = [
    {
      key: 'theme',
      label: i18n.t('theme'),
      onClick: () => {
        const theme = settings.theme === 'dark' ? 'light' : 'dark';
        saveSettings({ theme });
      },
      icon:
        settings.theme === 'dark' ? (
          <SunIcon className="mr-2 size-4" />
        ) : (
          <MoonIcon className="mr-2 size-4" />
        ),
    },
    {
      key: 'support',
      label: i18n.t('support'),
      onClick: () => {
        sendMessage(GENERAL_MESSAGES.OPEN_TAB, { url: 'https://www.linkedin.com/in/oyzamil/' });
      },
      icon: <ChatIcon className="mr-2 size-4" />,
    },
    {
      key: 'settings',
      label: i18n.t('settings'),
      onClick: () => {
        browser.runtime.openOptionsPage();
      },
      icon: <SettingsIcon className="mr-2 size-4" />,
    },
  ];

  return (
    <>
      <header className={'bg-app-500 z-51 flex w-full items-center px-2 py-3 dark:bg-black'}>
        <Watermark className="flex w-full items-center text-xl" />
        <div className="flex items-center justify-center gap-1">
          <Space.Compact block>
            <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
              <Button className="px-1" type="text">
                <BarsIcon className="size-5 text-white" />
              </Button>
            </Dropdown>
          </Space.Compact>
        </div>
      </header>
    </>
  );
}
