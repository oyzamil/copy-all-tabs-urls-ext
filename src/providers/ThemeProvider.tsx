import '@/assets/tailwind.css';
import { StyleProvider } from '@ant-design/cssinjs';
import '@fontsource/poppins';
import { theme as AntdTheme, App, ConfigProvider } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { GlobalToken } from 'antd/es/theme/interface';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children?: ReactNode;
  shadowContainer?: HTMLElement | ShadowRoot | null;
  popupContainer?: HTMLElement | null;
  theme?: ThemeType;
  cssContainer?: HTMLElement | null;
}

interface AntdContextProps {
  notification: NotificationInstance;
  message: MessageInstance;
  modal: Omit<ModalStaticFunctions, 'warn'>;
  theme?: ThemeType;
  token: GlobalToken;
}

type StyleObject = Partial<CSSStyleDeclaration>;

interface ApplyStyles {
  root?: string;
  anchor?: StyleObject;
  anchorParent?: StyleObject;
  shadowHost?: StyleObject;
  uiContainer?: StyleObject;
}
interface CreateAndMountUI {
  anchor: string;
  position?: 'inline' | 'overlay' | 'modal';
  children: ReactNode;
  id?: string;
  style?: ApplyStyles;
}

let AntdContext: React.Context<AntdContextProps | null>;

if (!(globalThis as any).__antd_context__) {
  (globalThis as any).__antd_context__ = createContext<AntdContextProps | null>(null);
}
AntdContext = (globalThis as any).__antd_context__;

const StaticComponents = ({
  children,
  shadowContainer,
  popupContainer,
  theme,
  cssContainer,
}: ThemeProviderProps) => {
  const { token } = AntdTheme.useToken();

  const currentAlgorithm = theme === 'dark' ? AntdTheme.darkAlgorithm : AntdTheme.defaultAlgorithm;

  return (
    <StyleProvider
      container={cssContainer || shadowContainer || document.body}
      layer
      hashPriority="high"
    >
      <ConfigProvider
        theme={{
          algorithm: currentAlgorithm,
          token: {
            colorPrimary: useAppConfig().APP.color,
            fontFamily: [useAppConfig().APP.font, token.fontFamily].toString(),
          },
          components: {
            Alert: {
              defaultPadding: '12px',
              withDescriptionPadding: '12px',
              withDescriptionIconSize: 18,
            },
            Slider: {
              handleColor: useAppConfig().APP.color,
              trackBg: useAppConfig().APP.color,
              trackHoverBg: useAppConfig().APP.color,
            },
            Button: {
              primaryShadow: 'none',
            },
          },
        }}
        getPopupContainer={() => popupContainer || document.body}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
};

// Dynamic components (depend on App context)
const DynamicComponents = ({ children, theme }: { children: ReactNode; theme: ThemeType }) => {
  const { message, notification, modal } = App.useApp();
  const { token } = AntdTheme.useToken();

  return (
    <AntdContext.Provider
      value={{
        message,
        notification,
        modal,
        theme,
        token,
      }}
    >
      {children}
    </AntdContext.Provider>
  );
};

export const ThemeProvider = ({
  children,
  shadowContainer,
  popupContainer,
  cssContainer,
}: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const { settings } = useSettings();

  useEffect(() => {
    let resolvedTheme: ThemeType = 'light';

    if (settings.theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = isSystemDark ? 'dark' : 'light';
    } else {
      resolvedTheme = settings.theme;
    }

    setTheme(resolvedTheme);
    updateBodyClass(resolvedTheme);
  }, [settings]);

  const updateBodyClass = (theme: ThemeType) => {
    const doc = document.querySelector(getPackageProp('name')) || document.documentElement;
    doc.classList.toggle('dark', theme === 'dark');
    doc.classList.toggle('light', theme === 'light');

    if (theme === 'dark') {
      doc.setAttribute('data-theme', 'dark');
    } else {
      doc.removeAttribute('data-theme');
    }
  };

  return (
    <StaticComponents
      shadowContainer={shadowContainer}
      popupContainer={popupContainer}
      theme={theme}
      cssContainer={cssContainer}
    >
      <App className={theme}>
        <DynamicComponents theme={theme}>{children}</DynamicComponents>
      </App>
    </StaticComponents>
  );
};

export const useAntd = (): AntdContextProps => {
  const context = useContext(AntdContext);
  if (!context) {
    throw new Error('useAntd must be used within an AntdProvider');
  }
  return context;
};

const applyStyles = async (
  style: ApplyStyles,
  anchor: string,
  shadowHost: HTMLElement,
  uiContainer: HTMLElement
): Promise<void> => {
  if (style?.root) {
    injectStyleToMainDom(style.root);
  }

  if (style?.anchor) {
    const anchorEl = document.querySelector(anchor) as HTMLElement | null;
    if (anchorEl) {
      Object.assign(anchorEl.style, style.anchor);
    }
  }

  if (style?.anchorParent) {
    const anchorParent = document.querySelector(anchor)?.parentElement as HTMLElement | null;
    if (anchorParent) {
      Object.assign(anchorParent.style, style.anchorParent);
    }
  }

  if (style?.shadowHost) {
    Object.assign(shadowHost.style, style.shadowHost);
  }

  if (style?.uiContainer) {
    Object.assign(uiContainer.style, style.uiContainer);
  }
};

export const createAndMountUI = async (ctx: any, props: CreateAndMountUI) => {
  const { anchor, position = 'inline', children, style, id = getPackageProp('name') } = props;
  try {
    const ui = await createShadowRootUi(ctx, {
      name: id,
      position: position,
      anchor: anchor,

      onMount: (uiContainer, shadow, shadowHost) => {
        const cssContainer = shadow.querySelector('head')!;
        shadowHost.id = id;
        uiContainer.id = 'content-ui';

        //         function buildFontFaces() {
        //           return `
        // @font-face {
        //   font-family: 'Poppins';
        //   font-weight: 400;
        //   src: url('${browser.runtime.getURL('/fonts/poppins/Poppins-Regular.ttf')}');
        // }

        // @font-face {
        //   font-family: 'Poppins';
        //   font-weight: 600;
        //   src: url('${browser.runtime.getURL('/fonts/poppins/Poppins-SemiBold.ttf')}');
        // }

        // @font-face {
        //   font-family: 'Poppins';
        //   font-weight: 700;
        //   src: url('${browser.runtime.getURL('/fonts/poppins/Poppins-Bold.ttf')}');
        // }
        // `;
        //         }

        //         const styleFonts = document.createElement('style');
        //         styleFonts.textContent = buildFontFaces();
        //         shadow.appendChild(styleFonts);

        // const tailwindStyle = document.createElement('style');
        // tailwindStyle.textContent = tailwindCSS;
        // cssContainer.appendChild(tailwindStyle);

        const root = createRoot(uiContainer);
        root.render(
          <ThemeProvider
            shadowContainer={shadow}
            popupContainer={uiContainer}
            cssContainer={cssContainer}
          >
            {children}
          </ThemeProvider>
        );
        return { root, uiContainer };
      },
      // Ensure removal is only triggered when needed
      onRemove: (elements) => {
        if (elements?.root && elements?.uiContainer) {
          elements?.root.unmount();
          elements?.uiContainer.remove();
        }
      },
    });

    if (!document.getElementById(id)) {
      ui.autoMount();
    }
    return ui;
  } catch (error) {
    console.error(`Failed to mount UI to anchor: ${anchor}`, error);
    return null;
  }
};

export { StyleProvider };

const injectStyleToMainDom = (cssCode: string): HTMLStyleElement => {
  // Create a new <style> element
  const styleElement = document.createElement('style');

  // Set the CSS code as the content of the style element
  styleElement.textContent = cssCode;

  // Append the style element to the document's <head>
  document.head.appendChild(styleElement);

  // Return the created style element (optional)
  return styleElement;
};
