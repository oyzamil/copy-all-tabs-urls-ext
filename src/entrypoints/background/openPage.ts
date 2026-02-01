export const openPage = async (url: string, options: OpenPageOptions = {}) => {
  if (!url) {
    return { success: false, message: 'URL not valid!' };
  }

  const { current = false, active = true, newWindow = false } = options;

  // 👉 Replace current tab
  if (current) {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTab?.id != null) {
      await browser.tabs.update(activeTab.id, { url, active });
      return { success: true, message: 'Current tab updated!' };
    }
  }

  // 👉 Open in new window (optional)
  if (newWindow) {
    await browser.windows.create({
      url,
      focused: active,
    });
    return { success: true, message: 'Opened in new window!' };
  }

  // 👉 Reuse existing tab
  const tabs = await browser.tabs.query({});
  const existingTab = tabs.find((tab) => tab.url === url);

  if (existingTab?.id != null) {
    await browser.tabs.update(existingTab.id, { active });
    await browser.windows.update(existingTab.windowId, { focused: active });
  } else {
    await browser.tabs.create({
      url,
      active,
    });
  }

  return { success: true, message: 'Tab opened!' };
};
