import { config } from '@/app.config';
import { Alert, Card, Input, Switch, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const { settings, saveSettings } = useSettings();

  const [showTitleWarning, setShowTitleWarning] = useState<boolean>(false);
  const [showTypoWarning, setShowTypoWarning] = useState<boolean>(false);

  useEffect(() => {
    checkTitleWarning();
    checkTemplateTypos();
  }, [settings.templates, settings.copyTitleEnabled]);

  const checkTitleWarning = () => {
    const templateHasTitle = settings.templates.plain.includes('{TITLE}');
    const toggleIsOff = !settings.copyTitleEnabled;
    setShowTitleWarning(templateHasTitle && toggleIsOff);
  };

  const checkTemplateTypos = () => {
    const val = settings.templates.plain;
    const hasDoubleBraces = /\{\{(?:TITLE|URL)\}\}/i.test(val);
    const matches = val.match(/\{\s*(?:title|url)\s*\}/gi) || [];
    const hasMalformedSingleBraces = matches.some((m) => m !== '{TITLE}' && m !== '{URL}');
    setShowTypoWarning(hasDoubleBraces || hasMalformedSingleBraces);
  };

  const resetToDefaults = () => {
    saveSettings({
      copyTitleEnabled: config.SETTINGS.copyTitleEnabled,
      templates: { ...config.SETTINGS.templates },
    });
  };

  const getPlaceholder = () => {
    return settings.copyTitleEnabled ? '{TITLE} - {URL}' : '{URL}';
  };

  return (
    <div className="bg-app-100/50 text-theme flex min-h-screen flex-col items-center antialiased">
      {/* Main Content */}
      <main className="max-w-3xl space-y-6 p-6 sm:p-8 lg:p-10">
        <header className="flex items-center justify-between">
          <Watermark
            className="text-theme text-xl"
            logoClassName="size-12"
            taglineClassName="text-xs"
            tagline={i18n.t('appDescription')}
          />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </header>
        <Card title="Copy Title with URL">
          <div className="flex justify-between">
            <p className="mt-1 text-sm">Include the page titles when copying multiple URLs.</p>

            <Switch
              checked={settings.copyTitleEnabled}
              onChange={(copyTitleEnabled) => {
                saveSettings({ copyTitleEnabled });
              }}
            />
          </div>
        </Card>

        <Card title="Customize Copy Formats">
          <p className="mb-6 text-sm">
            Define custom templates using <Typography.Text keyboard>{'{TITLE}'}</Typography.Text>{' '}
            and <Typography.Text keyboard>{'{URL}'}</Typography.Text> placeholders. Press Enter for
            new lines.
          </p>

          {/* Plain Format */}
          <div className="space-y-2">
            <label className="block text-base font-medium" htmlFor="plain-template">
              Plain URLs Template
            </label>
            <Input.TextArea
              rows={3}
              value={settings.templates.plain || getPlaceholder()}
              onChange={(e) => {
                saveSettings({ templates: { plain: e.target.value } });
              }}
              placeholder={getPlaceholder()}
            />
            {showTitleWarning && (
              <Alert
                type="error"
                title={`⚠️ Warning: "Copy Title with URL" is disabled. {'{TITLE}'} will be removed from output.`}
              />
            )}
            {showTypoWarning && (
              <Alert
                type="error"
                title={`⚠️ Warning: Potential typo detected. Use {'{TITLE}'} and {'{URL}'}.`}
              />
            )}
          </div>
        </Card>

        <Card>
          <Button type="primary" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default App;
