type NotificationVariant = 'loading' | 'success' | 'error';

export type NotifyOptions = {
  id: string; // REQUIRED for updates
  title: string;
  message: string;
  variant?: NotificationVariant;

  timeoutMs?: number;
  closeOnClick?: boolean;

  onClick?: () => void;
  onCancel?: () => void;

  link?: string;
  showButtons?: boolean;
};

const notificationQueue = new Map<string, NotifyOptions>();

export async function notify(options: NotifyOptions): Promise<void> {
  const {
    id,
    title,
    message,
    variant = 'success',
    timeoutMs = variant === 'loading' ? 0 : 4000,
    closeOnClick = true,
    onClick,
    onCancel,
    link,
    showButtons = true,
  } = options;

  // Store latest state in queue
  notificationQueue.set(id, options);

  try {
    const createOptions: Browser.notifications.NotificationCreateOptions = {
      type: 'basic',
      title,
      message,
      iconUrl: getIconByVariant(variant),
      priority: 2,
    };
    const browserName = await getBrowserName();
    // Buttons → Chrome only
    if (browserName !== 'firefox' && showButtons && (onClick || onCancel)) {
      createOptions.buttons = [
        ...(onClick || link ? [{ title: 'Open' }] : []),
        ...(onCancel ? [{ title: 'Dismiss' }] : []),
      ];
    }

    // 🔁 Create OR Update notification
    await browser.notifications.create(id, createOptions);

    // ⏱ Auto-dismiss (not for loading)
    if (timeoutMs > 0) {
      setTimeout(() => {
        if (notificationQueue.has(id)) {
          browser.notifications.clear(id).catch(() => {});
          notificationQueue.delete(id);
        }
      }, timeoutMs);
    }

    // 🖱 Click handler
    browser.notifications.onClicked.addListener(function handleClick(clickedId) {
      if (clickedId !== id) return;

      if (link) {
        browser.tabs.create({ url: link });
      } else {
        onClick?.();
      }

      if (closeOnClick) {
        browser.notifications.clear(id).catch(() => {});
        notificationQueue.delete(id);
      }

      browser.notifications.onClicked.removeListener(handleClick);
    });

    // 🔘 Button handler (Chrome only)
    browser.notifications.onButtonClicked.addListener(
      function handleButtons(clickedId, buttonIndex) {
        if (clickedId !== id) return;

        if (buttonIndex === 0) {
          link ? browser.tabs.create({ url: link }) : onClick?.();
        }

        if (buttonIndex === 1) {
          onCancel?.();
        }

        browser.notifications.clear(id).catch(() => {});
        notificationQueue.delete(id);

        browser.notifications.onButtonClicked.removeListener(handleButtons);
      }
    );
  } catch (err) {
    console.warn('Notification failed:', err);
  }
}

function getIconByVariant(variant: NotificationVariant): string {
  switch (variant) {
    case 'loading':
      return browser.runtime.getURL('/icons/128.png');
    case 'error':
      return browser.runtime.getURL('/icons/128.png');
    default:
      return browser.runtime.getURL('/icons/128.png');
  }
}
