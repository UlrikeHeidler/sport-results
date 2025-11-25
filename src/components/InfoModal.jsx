import React, { useState, useEffect } from 'react';
import './InfoModal.css';

const InfoModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('readme');
  const [readmeContent, setReadmeContent] = useState('');
  const [licenseContent, setLicenseContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch README and LICENSE files
      const fetchContent = async () => {
        setLoading(true);
        try {
          const baseUrl = import.meta.env.BASE_URL || '/';
          const [readmeRes, licenseRes] = await Promise.all([
            fetch(`${baseUrl}README.md`),
            fetch(`${baseUrl}LICENSE`)
          ]);
          
          const readmeText = await readmeRes.text();
          const licenseText = await licenseRes.text();
          
          setReadmeContent(readmeText);
          setLicenseContent(licenseText);
        } catch (error) {
          console.error('Error fetching documentation:', error);
          setReadmeContent('Error loading README content.');
          setLicenseContent('Error loading LICENSE content.');
        } finally {
          setLoading(false);
        }
      };

      fetchContent();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Simple markdown-to-HTML converter for basic formatting
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Convert code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // Convert headers
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert bold and italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert line breaks
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');
    
    return '<p>' + text + '</p>';
  };

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
                <div 
                  className="info-content readme-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(readmeContent) }}
                />
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
