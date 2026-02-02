import { FilterIcon, PinIcon, StackIcon, TickIcon } from '@/icons';
import { useAntd } from '@/providers/ThemeProvider';
import { Checkbox, Dropdown, Input, Segmented, Space, Switch, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import OpenLinksModal from './OpenLinksModal';

export type CopyFormat = 'plain' | 'markdown' | 'json' | 'csv';
export type ActiveFilter = 'all' | 'pinned';

// Main Component
const Home: React.FC = () => {
  const { message } = useAntd();
  const { settings, saveSettings } = useSettings();
  const [inputModalVisibility, setInputModalVisibility] = useState(false);
  // State
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [filteredTabs, setFilteredTabs] = useState<TabItem[]>([]);
  const [lastClickedTabId, setLastClickedTabId] = useState<number | null>(null);
  const [shiftNotificationShown, setShiftNotificationShown] = useState(false);
  const [currentWindowId, setCurrentWindowId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  // Computed values
  const selectedCount = tabs.filter((tab) => tab.selected).length;
  const allTabsCount = tabs.length;
  const pinnedTabsCount = tabs.filter((tab) => tab.pinned).length;
  const hasSelectedTabs = selectedCount > 0;

  // Load initial data
  useEffect(() => {
    const init = async () => {
      await loadTabs();
    };
    init();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndRender();
  }, [tabs, searchQuery, settings.activeFilter, settings.isHidePinnedEnabled]);

  // Functions
  const loadTabs = async () => {
    try {
      const currentWindow = await browser.windows.getCurrent();
      setCurrentWindowId(currentWindow.id || 0);

      let allTabs: TabItem[] = [];
      // Mock data - replace with actual browser.tabs.query
      if (settings.currentWindowOnly) {
        allTabs = (await browser.tabs.query({
          windowId: currentWindowId,
        })) as TabItem[];
      } else {
        allTabs = (await browser.tabs.query({})) as TabItem[];
      }

      setTabs(
        allTabs.map((tab) => ({
          id: tab.id || 0,
          title: tab.title || 'Untitled',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl || '',
          selected: false,
          pinned: tab.pinned,
          windowId: tab.windowId,
          active: tab.active,
        }))
      );
    } catch (error) {
      console.error('Error loading tabs:', error);
    }
  };

  const applyFiltersAndRender = () => {
    const query = searchQuery.toLowerCase();
    let baseFiltered = tabs;

    if (settings.activeFilter === 'pinned') {
      baseFiltered = tabs.filter((tab) => tab.pinned);
    } else if (settings.activeFilter === 'all' && settings.isHidePinnedEnabled) {
      baseFiltered = tabs.filter((tab) => !tab.pinned);
    }

    if (query) {
      setFilteredTabs(
        baseFiltered.filter(
          (tab) => tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredTabs([...baseFiltered]);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = filteredTabs.every((tab) => tab.selected);
    const newSelectedState = !allSelected;

    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        const isInFiltered = filteredTabs.some((ft) => ft.id === tab.id);
        return isInFiltered ? { ...tab, selected: newSelectedState } : tab;
      })
    );
  };

  const toggleTabSelection = (tabId: number, shiftKey: boolean) => {
    const currentTabIndexInFiltered = filteredTabs.findIndex((t) => t.id === tabId);
    if (currentTabIndexInFiltered === -1) return;

    if (shiftKey && lastClickedTabId !== null && lastClickedTabId !== tabId) {
      const lastClickedIndexInFiltered = filteredTabs.findIndex((t) => t.id === lastClickedTabId);

      if (lastClickedIndexInFiltered !== -1) {
        const start = Math.min(currentTabIndexInFiltered, lastClickedIndexInFiltered);
        const end = Math.max(currentTabIndexInFiltered, lastClickedIndexInFiltered);

        setTabs((prevTabs) =>
          prevTabs.map((tab) => {
            const indexInFiltered = filteredTabs.findIndex((ft) => ft.id === tab.id);
            if (indexInFiltered >= start && indexInFiltered <= end) {
              return { ...tab, selected: true };
            }
            return tab;
          })
        );
      }
    } else {
      setTabs((prevTabs) =>
        prevTabs.map((tab) => {
          if (tab.id === tabId) {
            const newSelected = !tab.selected;
            if (newSelected && selectedCount >= 3 && !shiftNotificationShown) {
              message.info('Tip: Use Shift+Click to select a range of tabs quickly.');
              setShiftNotificationShown(true);
            }
            return { ...tab, selected: newSelected };
          }
          return tab;
        })
      );
      setLastClickedTabId(tabId);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };

  const handleCopySelected = async () => {
    const selectedTabs = tabs.filter((tab) => tab.selected);
    if (selectedTabs.length === 0) return;

    let textToCopy = '';
    let formatDesc = '';

    switch (settings.selectedCopyFormat) {
      case 'markdown':
        textToCopy = formatUrlsMarkdown(selectedTabs);
        formatDesc = 'Markdown';
        break;
      case 'json':
        textToCopy = formatUrlsJson(selectedTabs);
        formatDesc = 'JSON';
        break;
      case 'csv':
        downloadFile(formatUrlsCsv(selectedTabs), 'tab-grab-export.csv', 'text/csv;charset=utf-8;');
        message.success('CSV file exported');
        return;
      case 'plain':
      default:
        textToCopy = formatUrlsPlain(selectedTabs, settings, settings.templates.plain);
        formatDesc = 'URLs';
        break;
    }

    const success = await copyToClipboard(textToCopy);
    message.success(success ? `Selected ${formatDesc} copied` : `Failed to copy ${formatDesc}`);
  };

  const handleCopySingleUrl = async (url: string) => {
    const success = await copyToClipboard(url);
    return success;
  };

  const toggleGroupDomain = (domain: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        let tabDomain = 'Other';
        try {
          const urlObj = new URL(tab.url);
          if (urlObj.hostname) {
            tabDomain = urlObj.hostname.replace(/^www\./i, '');
          }
        } catch {}

        if (tabDomain === domain) {
          return { ...tab, selected: !tab.selected };
        }
        return tab;
      })
    );
  };

  // Check if select all should be checked/indeterminate
  const getSelectAllState = () => {
    if (filteredTabs.length === 0) return { checked: false, indeterminate: false };
    const selectedInFiltered = filteredTabs.filter((tab) => tab.selected).length;
    if (selectedInFiltered === 0) return { checked: false, indeterminate: false };
    if (selectedInFiltered === filteredTabs.length) return { checked: true, indeterminate: false };
    return { checked: false, indeterminate: true };
  };

  const selectAllState = getSelectAllState();

  const getCopyButtonText = () => {
    switch (settings.selectedCopyFormat) {
      case 'markdown':
        return 'Copy Markdown';
      case 'json':
        return 'Copy JSON';
      case 'csv':
        return 'Export CSV';
      default:
        return 'Copy URLs';
    }
  };

  // Render grouped tabs
  const renderGroupedTabs = () => {
    const groupedTabs: { [domain: string]: TabItem[] } = {};

    filteredTabs.forEach((tab) => {
      let domain = 'Other';
      try {
        const url = new URL(tab.url);
        if (url.hostname) {
          domain = url.hostname.replace(/^www\./i, '');
        }
      } catch (e) {
        console.warn(`Could not parse URL for grouping: ${tab.url}`);
      }
      if (!groupedTabs[domain]) {
        groupedTabs[domain] = [];
      }
      groupedTabs[domain].push(tab);
    });

    const sortedDomains = Object.keys(groupedTabs).sort();

    return sortedDomains.map((domain) => {
      const tabsInGroup = groupedTabs[domain];
      const selectedInGroup = tabsInGroup.filter((t) => t.selected).length;
      const allSelected = selectedInGroup === tabsInGroup.length;
      const someSelected = selectedInGroup > 0 && !allSelected;

      return (
        <div key={domain}>
          <div className="sticky -top-2.5 z-10 flex items-center gap-2 bg-white px-2 pt-1 pb-2 text-xs font-semibold text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <div
              className={`relative h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-2 ${
                allSelected
                  ? `border-app-500 bg-app-500 after:absolute after:-top-px after:left-0.75 after:h-2 after:w-1 after:rotate-45 after:border-r-2 after:border-b-2 after:border-white after:content-[""]`
                  : someSelected
                    ? 'border-app-500 bg-app-500/50'
                    : 'border-theme'
                }`}
              onClick={() => toggleGroupDomain(domain)}
            />
            <span className="truncate">{domain}</span>
          </div>
          <div className="ml-3 space-y-2">
            {tabsInGroup.map((tab) => (
              <TabElement
                key={tab.id}
                tab={tab}
                onToggleSelect={toggleTabSelection}
                onCopyUrl={handleCopySingleUrl}
                loadTabs={loadTabs}
              />
            ))}
          </div>
        </div>
      );
    });
  };

  function togglePin(selectedTabs: TabItem[]) {
    // Map each tab to a promise
    const pinPromises = selectedTabs.map((tab) => {
      return new Promise((resolve, reject) => {
        browser.tabs.update(tab.id, { pinned: !tab.pinned }, (updatedTab) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(updatedTab);
          }
        });
      });
    });

    // Wait for all tabs to be pinned
    return Promise.all(pinPromises);
  }

  type TabGroupColor =
    | 'grey'
    | 'blue'
    | 'red'
    | 'yellow'
    | 'green'
    | 'pink'
    | 'purple'
    | 'cyan'
    | 'orange';

  const TAB_GROUP_COLORS: TabGroupColor[] = [
    'grey',
    'blue',
    'red',
    'yellow',
    'green',
    'pink',
    'purple',
    'cyan',
    'orange',
  ];

  function getRandomColor(): TabGroupColor {
    return TAB_GROUP_COLORS[Math.floor(Math.random() * TAB_GROUP_COLORS.length)];
  }

  function getGroupTitle(tab: TabItem): string {
    try {
      const { hostname } = new URL(tab.url);
      return hostname.replace(/^www\./, '');
    } catch {
      return tab.title || 'Tab Group';
    }
  }

  // ---------- TYPE GUARD ----------
  function isRealTab(tab: Browser.tabs.Tab | null): tab is Browser.tabs.Tab {
    return tab !== null;
  }

  async function groupSelected(selectedTabs: TabItem[]): Promise<number | null> {
    const fetchedTabs = await Promise.all(
      selectedTabs.map((t) => browser.tabs.get(t.id).catch(() => null))
    );

    const ungroupedTabs = fetchedTabs
      .filter(isRealTab)
      .filter((tab) => tab.groupId === undefined || tab.groupId === -1);

    if (ungroupedTabs.length === 0) {
      return null;
    }

    const tabIds = ungroupedTabs.map((tab) => tab.id) as [number, ...number[]];

    // 1️⃣ Create group
    const groupId = await browser.tabs.group({ tabIds });

    const groupName = getGroupTitle(selectedTabs[0]);
    const groupColor = getRandomColor();

    // 2️⃣ Update group (browser-only)
    if (browser.tabGroups) {
      await browser.tabGroups.update(groupId, {
        title: groupName,
        color: groupColor,
        collapsed: true,
      });
    }

    return groupId;
  }

  return (
    <div className="flex flex-col space-y-3 p-2">
      {/* Search Input */}
      <div className="flex-center gap-3">
        <Input
          defaultValue={searchQuery}
          placeholder="Search tabs by title or URL..."
          allowClear
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          type="primary"
          tooltip="Open URLs"
          onClick={() => {
            setInputModalVisibility(true);
          }}
        >
          <svg
            className="size-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" />
            <path d="M9 15l3 -3l3 3" />
            <path d="M12 12l0 9" />
          </svg>
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="relative flex w-full items-center justify-between">
        <Segmented
          value={settings.activeFilter}
          styles={{
            label: {
              paddingRight: '2px',
            },
          }}
          options={[
            {
              label: (
                <>
                  All Tabs <span className="badge">{allTabsCount}</span>
                </>
              ),
              value: 'all',
            },
            {
              label: (
                <>
                  Pinned <span className="badge">{pinnedTabsCount}</span>
                </>
              ),
              value: 'pinned',
            },
          ]}
          onChange={(activeFilter: ActiveFilter) => saveSettings({ activeFilter })}
        />

        <Dropdown
          menu={{
            items: [
              {
                key: '1',
                className: 'p-0',
                label: (
                  <FieldSet
                    className="flex flex-row-reverse justify-between gap-2"
                    childrenClassName="w-auto"
                    labelClassName="font-normal text-xs"
                    label="Group Domains"
                  >
                    <Switch
                      size="small"
                      onChange={(isGroupingEnabled) => saveSettings({ isGroupingEnabled })}
                      checked={settings.isGroupingEnabled}
                    />
                  </FieldSet>
                ),
                onClick: (e: any) => e.preventDefault(),
              },
              {
                key: '2',
                className: 'p-0',
                label: (
                  <FieldSet
                    className="flex flex-row-reverse justify-between gap-2"
                    childrenClassName="w-auto"
                    labelClassName="font-normal text-xs"
                    label="Hide Pinned"
                  >
                    <Switch
                      size="small"
                      onChange={(isHidePinnedEnabled) => saveSettings({ isHidePinnedEnabled })}
                      checked={settings.isHidePinnedEnabled}
                      disabled={settings.activeFilter !== 'all'}
                    />
                  </FieldSet>
                ),
                onClick: (e: any) => e.preventDefault(),
              },
              {
                key: '3',
                className: 'p-0',
                label: (
                  <FieldSet
                    className="flex flex-row-reverse justify-between gap-2"
                    childrenClassName="w-auto"
                    labelClassName="font-normal text-xs"
                    label="Current Window"
                  >
                    <Switch
                      size="small"
                      onChange={async (currentWindowOnly) => {
                        saveSettings({ currentWindowOnly });
                        await loadTabs();
                      }}
                      checked={settings.currentWindowOnly}
                    />
                  </FieldSet>
                ),
                onClick: (e: any) => e.preventDefault(),
              },
            ],
          }}
          placement="bottomRight"
          trigger={'click' as any}
          arrow
        >
          <Button className="w-10 py-3" type="primary" size="small" icon={<FilterIcon />} />
        </Dropdown>
      </div>

      {/* Select All */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex-center gap-1">
          <Checkbox
            indeterminate={selectAllState.indeterminate}
            onChange={toggleSelectAll}
            checked={selectAllState.checked}
          >
            Check all
          </Checkbox>
          {(selectAllState.checked || selectAllState.indeterminate) && (
            <>
              <Button
                className="h-auto py-0.5 text-[10px]"
                size="small"
                shape="circle"
                type="primary"
                tooltip={'Pin/Unpin Selected'}
                onClick={() => {
                  const selectedTabs = tabs.filter((tab) => tab.selected);

                  togglePin(selectedTabs)
                    .then(async () => {
                      message.success('All tabs pinned!');
                      await loadTabs();
                    })
                    .catch((err) => {
                      message.error('Failed to pin some tabs', err);
                    });
                }}
              >
                <PinIcon className="" />
              </Button>

              <Button
                className="h-auto py-0.5 text-[10px]"
                size="small"
                shape="circle"
                type="primary"
                tooltip={'Group Selected'}
                onClick={async () => {
                  const currentBrowser = await getBrowserName();

                  if (currentBrowser === 'firefox') {
                    message.error('Firefox does not support Tab Grouping');
                    return;
                  }
                  const selectedTabs = tabs.filter((tab) => tab.selected);
                  groupSelected(selectedTabs)
                    .then(async (groupId) => {
                      if (groupId === null) {
                        message.info('Nothing to group');
                      } else {
                        message.success(`Created group: ${groupId}`);
                        await loadTabs();
                      }
                    })
                    .catch((err) => {
                      message.error('Grouping failed');
                      console.error('Grouping failed', err);
                    });
                }}
              >
                <StackIcon className="" />
              </Button>
            </>
          )}
        </div>

        <div className="badge-invert">
          <span>{selectedCount}</span> selected
        </div>
      </div>

      {/* Tabs Container */}
      <div className="bg-theme scrollbar-0 add-border relative max-h-80 flex-1 space-y-2 overflow-y-auto">
        {filteredTabs.length === 0 ? (
          <NoTabsMessage />
        ) : settings.isGroupingEnabled ? (
          renderGroupedTabs()
        ) : (
          filteredTabs.map((tab) => (
            <TabElement
              key={tab.id}
              tab={tab}
              onToggleSelect={toggleTabSelection}
              onCopyUrl={handleCopySingleUrl}
              loadTabs={loadTabs}
            />
          ))
        )}
      </div>

      {/* Footer Actions */}
      <Space.Compact>
        <Button
          className="w-full"
          type="primary"
          onClick={handleCopySelected}
          disabled={!hasSelectedTabs}
          icon={<CopyIcon />}
        >
          {getCopyButtonText()}
        </Button>
        <Dropdown
          menu={{
            items: [
              {
                label: 'Plain URLs',
                key: '1',
                onClick: () => saveSettings({ selectedCopyFormat: 'plain' }),
                className: settings.selectedCopyFormat === 'plain' ? 'bg-app-200' : '',
              },
              {
                label: 'Markdown List',
                key: '2',
                onClick: () => saveSettings({ selectedCopyFormat: 'markdown' }),
                className: settings.selectedCopyFormat === 'markdown' ? 'bg-app-200' : '',
              },
              {
                label: 'JSON Array',
                key: '3',
                onClick: () => saveSettings({ selectedCopyFormat: 'json' }),
                className: settings.selectedCopyFormat === 'json' ? 'bg-app-200' : '',
              },
              {
                label: 'CSV Export',
                key: '4',
                onClick: () => saveSettings({ selectedCopyFormat: 'csv' }),
                className: settings.selectedCopyFormat === 'csv' ? 'bg-app-200' : '',
              },
            ],
          }}
          placement="bottomRight"
          trigger={'click' as any}
          arrow
        >
          <Button
            className="w-10"
            type="primary"
            icon={<ChevronIcon />}
            disabled={!hasSelectedTabs}
          />
        </Dropdown>
      </Space.Compact>
      <OpenLinksModal
        isOpen={inputModalVisibility}
        onClose={() => setInputModalVisibility(false)}
        onOpenLinks={(links) => {
          message.success('All Links Opened!');
        }}
      />
    </div>
  );
};

// Sub-components
const TabElement: React.FC<{
  tab: TabItem;
  onToggleSelect: (tabId: number, shiftKey: boolean) => void;
  onCopyUrl: (url: string) => Promise<boolean>;
  loadTabs?: () => Promise<void>;
}> = ({ tab, onToggleSelect, onCopyUrl, loadTabs }) => {
  const [showCheckmark, setShowCheckmark] = useState(false);
  const { message } = useAntd();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await onCopyUrl(tab.url);
    if (success) {
      setShowCheckmark(true);
      setTimeout(() => setShowCheckmark(false), 1500);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center rounded-lg border p-2 transition-colors duration-200',
        tab.selected || tab.active
          ? `border-app-200 bg-app-50 hover:bg-app-100 dark:border-app-500/30 dark:bg-app-900/30 dark:hover:bg-app-800/50`
          : `border-neutral-300 bg-white hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:bg-neutral-800`
      )}
      title={tab.title}
    >
      <Checkbox
        checked={tab.selected}
        onChange={(e: any) => onToggleSelect(tab.id, e.nativeEvent.shiftKey)}
      />

      {tab.favIconUrl ? (
        <img className="mx-2 h-4 w-4 shrink-0 rounded object-contain" src={tab.favIconUrl} alt="" />
      ) : (
        <div className="bg-app-100 text-app-600 dark:bg-app-900/50 dark:text-app-400 mr-2 ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded text-xs font-bold">
          {tab.url.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="mr-2 w-full min-w-0 flex-1 truncate">
        <div className="truncate text-sm">{tab.title}</div>
        <div className="truncate text-xs text-neutral-500 dark:text-neutral-400/60">
          {tab.url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
        </div>
      </div>

      {tab.pinned && (
        <Tooltip title="Unpin Tab" key={tab.id}>
          <span
            onClick={() => {
              if (!tab.id) return;
              browser.tabs.update(tab.id, { pinned: false }, async (tab) => {
                message.success('Tab Unpinned!');
                if (loadTabs) await loadTabs();
              });
            }}
          >
            <PinIcon className="ml-1" />
          </span>
        </Tooltip>
      )}

      <Button className="p-0.5" tooltip="Copy" type="text" onClick={handleCopy} title="Copy URL">
        {showCheckmark ? (
          <TickIcon />
        ) : (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </Button>
    </div>
  );
};

const NoTabsMessage: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-8">
    No tabs found matching your search
  </div>
);

const CopyIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ChevronIcon: React.FC = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export default Home;
