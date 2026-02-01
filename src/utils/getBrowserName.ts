export async function getBrowserName(): Promise<BrowserName> {
  // Firefox-only global (works in MV2 + MV3)
  if (typeof (globalThis as any).InstallTrigger !== 'undefined') {
    return 'firefox';
  }

  return 'chromium';
}
