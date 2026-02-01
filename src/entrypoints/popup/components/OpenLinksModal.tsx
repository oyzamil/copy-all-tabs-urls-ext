import { useAntd } from '@/providers/ThemeProvider';
import { Input, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import React, { ChangeEvent, useState } from 'react';

interface OpenLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLinks?: (links: string[]) => void;
}

const OpenLinksModal: React.FC<OpenLinksModalProps> = ({ isOpen, onClose, onOpenLinks }) => {
  const [linksText, setLinksText] = useState<string>('');
  const { message } = useAntd();

  // Helper: extract URLs from any text
  const extractUrls = (text: string): string[] => {
    // Try Plain Text (lines starting with http[s])
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const plainTextUrls = lines.filter((l) => l.startsWith('http://') || l.startsWith('https://'));
    if (plainTextUrls.length === lines.length) return plainTextUrls;

    // Try Markdown [text](url)
    const mdRegex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    const mdUrls: string[] = [];
    let match;
    while ((match = mdRegex.exec(text)) !== null) {
      mdUrls.push(match[1]);
    }
    if (mdUrls.length) return mdUrls;

    // Try JSON array [{"url": "..."}]
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const jsonUrls = parsed
          .map((item) => (item?.url ? String(item.url).trim() : null))
          .filter(Boolean) as string[];
        if (jsonUrls.length) return jsonUrls;
      }
    } catch {}

    // Try CSV: look for lines with comma, second field is URL
    const csvLines = lines.filter((l) => l.includes(','));
    const csvUrls: string[] = [];
    if (csvLines.length) {
      csvLines.forEach((line) => {
        const parts = line.split(',');
        const url = parts[1]?.replace(/^"|"$/g, '').trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          csvUrls.push(url);
        }
      });
      if (csvUrls.length) return csvUrls;
    }

    // Fallback: regex to extract all URLs
    const urlRegex = /https?:\/\/[^\s<>"'`]+/g;
    const fallbackUrls = text.match(urlRegex);
    return fallbackUrls || [];
  };

  const openLinks = () => {
    if (!linksText.trim()) return;

    const links = extractUrls(linksText);
    if (!links.length) {
      message.warning('No valid URLs found');
      return;
    }

    links.forEach((link) => window.open(link, '_blank'));

    if (onOpenLinks) onOpenLinks(links);
    setLinksText('');
    onClose();
  };

  const handleFileChange = (file: RcFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const urls = extractUrls(text);
      if (!urls.length) {
        message.warning('No valid URLs found in the file');
        return;
      }
      setLinksText((prev) => (prev ? prev + '\n' + urls.join('\n') : urls.join('\n')));
    };
    reader.onerror = () => {
      message.error('Failed to read file');
    };
    reader.readAsText(file);
    return false; // prevent default upload
  };

  return (
    <Modal title="Open Multiple Links" isOpen={isOpen} onClose={onClose} footer={null} centered>
      <Upload className="flex-center" beforeUpload={handleFileChange} showUploadList={false}>
        <Button className="mb-2" type="dashed">
          Upload Links File (.txt, .csv, .json)
        </Button>
      </Upload>

      <Input.TextArea
        rows={8}
        placeholder="Paste links here, or upload a file"
        value={linksText}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLinksText(e.target.value)}
        style={{ marginBottom: 10 }}
      />

      <div className="flex-center gap-1">
        <Button className="w-full" key="cancel" onClick={onClose}>
          Cancel
        </Button>
        ,
        <Button className="w-full" key="open" type="primary" onClick={openLinks}>
          Open All Links
        </Button>
      </div>
    </Modal>
  );
};

export default OpenLinksModal;
