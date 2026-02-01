const offscreen = {
  path: '/offscreen.html' as any,

  async create() {
    if (await this.hasOffscreenDocument()) {
      return;
    }

    await browser.offscreen.createDocument({
      url: browser.runtime.getURL(this.path),
      reasons: ['DISPLAY_MEDIA'],
      justification: 'Screen capture',
    });
  },

  async hasOffscreenDocument(): Promise<boolean> {
    // Use the new getContexts API if supported
    const contexts = await browser.runtime?.getContexts?.({
      contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [browser.runtime.getURL(this.path)],
    });

    if (contexts != null) {
      return contexts.length > 0;
    } else {
      // fallback for older browsers or untyped runtime
      // self here is Service Worker scope
      const matchedClients = await (self as any).clients.matchAll();
      return matchedClients.some((client: any) => client.url.includes(browser.runtime.id));
    }
  },
  async close() {
    if (!(await this.hasOffscreenDocument())) {
      return;
    }
    await browser.offscreen.closeDocument();
  },
};
