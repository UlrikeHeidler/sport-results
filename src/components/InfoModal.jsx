import React, { useState, useEffect } from 'react';
import './InfoModal.css';

const renderInline = (text, keyPrefix) => {
  if (!text) return null;
  const parts = [];
  let i = 0;
  let plain = '';
  let k = 0;
  const key = () => `${keyPrefix}-${k++}`;

  const flush = () => { if (plain) { parts.push(plain); plain = ''; } };

  while (i < text.length) {
    if (text[i] === '[') {
      const labelEnd = text.indexOf('](', i);
      if (labelEnd !== -1) {
        const urlEnd = text.indexOf(')', labelEnd + 2);
        if (urlEnd !== -1) {
          flush();
          const label = text.slice(i + 1, labelEnd);
          const url = text.slice(labelEnd + 2, urlEnd);
          const safeHref = /^https?:\/\//i.test(url) ? url : '#';
          parts.push(<a key={key()} href={safeHref} target="_blank" rel="noopener noreferrer">{label}</a>);
          i = urlEnd + 1;
          continue;
        }
      }
    }
    if (text.startsWith('***', i)) {
      const end = text.indexOf('***', i + 3);
      if (end !== -1) { flush(); parts.push(<strong key={key()}><em>{text.slice(i + 3, end)}</em></strong>); i = end + 3; continue; }
    }
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) { flush(); parts.push(<strong key={key()}>{text.slice(i + 2, end)}</strong>); i = end + 2; continue; }
    }
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1) { flush(); parts.push(<em key={key()}>{text.slice(i + 1, end)}</em>); i = end + 1; continue; }
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) { flush(); parts.push(<code key={key()}>{text.slice(i + 1, end)}</code>); i = end + 1; continue; }
    }
    plain += text[i];
    i++;
  }
  flush();
  return parts;
};

const renderMarkdownToReact = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<pre key={k++}><code>{codeLines.join('\n')}</code></pre>);
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={k++}>{renderInline(line.slice(4), k)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={k++}>{renderInline(line.slice(3), k)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={k++}>{renderInline(line.slice(2), k)}</h1>);
    } else if (line.trim() !== '') {
      const paraLines = [];
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].trimStart().startsWith('```')) {
        paraLines.push(lines[i]);
        i++;
      }
      elements.push(<p key={k++}>{renderInline(paraLines.join(' '), k)}</p>);
      continue;
    }
    i++;
  }

  return elements.length > 0 ? elements : null;
};

const InfoModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('readme');
  const [readmeContent, setReadmeContent] = useState('');
  const [licenseContent, setLicenseContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchContent = async () => {
        setLoading(true);
        try {
          const baseUrl = import.meta.env.BASE_URL || '/';
          const [readmeRes, licenseRes, privacyRes] = await Promise.all([
            fetch(`${baseUrl}README.md`),
            fetch(`${baseUrl}LICENSE`),
            fetch(`${baseUrl}PRIVACY.md`)
          ]);

          if (!readmeRes.ok) throw new Error(`Failed to load README (${readmeRes.status})`);
          if (!licenseRes.ok) throw new Error(`Failed to load LICENSE (${licenseRes.status})`);
          if (!privacyRes.ok) throw new Error(`Failed to load PRIVACY (${privacyRes.status})`);

          const readmeText = await readmeRes.text();
          const licenseText = await licenseRes.text();
          const privacyText = await privacyRes.text();

          setReadmeContent(readmeText);
          setLicenseContent(licenseText);
          setPrivacyContent(privacyText);
        } catch (error) {
          console.error('Error fetching documentation:', error);
          setReadmeContent('Error loading README content.');
          setLicenseContent('Error loading LICENSE content.');
          setPrivacyContent('Error loading PRIVACY content.');
        } finally {
          setLoading(false);
        }
      };

      fetchContent();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="info-modal-close" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="info-modal-tabs">
          <button
            className={`info-tab ${activeTab === 'readme' ? 'active' : ''}`}
            onClick={() => setActiveTab('readme')}
          >
            About
          </button>
          <button
            className={`info-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
          <button
            className={`info-tab ${activeTab === 'license' ? 'active' : ''}`}
            onClick={() => setActiveTab('license')}
          >
            License
          </button>
        </div>

        <div className="info-modal-body">
          {loading ? (
            <div className="info-loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'readme' && (
                <div className="info-content readme-content">
                  {renderMarkdownToReact(readmeContent)}
                </div>
              )}
              {activeTab === 'privacy' && (
                <div className="info-content readme-content">
                  {renderMarkdownToReact(privacyContent)}
                </div>
              )}
              {activeTab === 'license' && (
                <div className="info-content license-content">
                  <pre>{licenseContent}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
