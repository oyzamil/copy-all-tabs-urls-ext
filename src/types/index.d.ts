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
type ProfileData = {
  profiles: string[];
  lastInteracted: Record<string, number>;
};
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? (T[P] extends any[] ? T[P] : DeepPartial<T[P]>) : T[P];
};

type IconType = {
  className?: string;
  stroke?: string;
  style?: React.CSSProperties;
};
type OpenPageOptions = {
  current?: boolean;
  active?: boolean;
  newWindow?: boolean;
};

type BrowserName = 'firefox' | 'chromium';

interface TabItem {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  selected: boolean;
  pinned: boolean;
  active?: boolean;
  windowId?: number;
}

interface PopupSettings {
  activeFilter: 'all' | 'pinned';
  isGroupingEnabled: boolean;
  isHidePinnedEnabled: boolean;
  currentWindowOnly: boolean;
}

interface OptionsSettings {
  clipboardSettings: ClipboardSettings;
}

interface ClipboardSettings {
  copyTitleEnabled: boolean;
}
