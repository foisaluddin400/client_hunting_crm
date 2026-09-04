import React, { useEffect, useState, useCallback } from 'react';
import { BusinessLead, ScrapableFieldKey } from '../types/business';
import {
  DEFAULT_SETTINGS,
  ScrapeCountMode,
  ScraperSettings,
  WebsiteFilterOption,
} from '../types/settings';
import { ExtensionMessage, ScrapingStatus } from '../types/messages';
import { loadSettings, saveSettings } from '../storage/settingsStorage';
import { validateSettings } from '../utils/validation';
import { downloadCsv } from '../csv/csvExporter';
import { CrmAuthState, getStoredAuth, importLeadsToCrm } from '../auth/crmAuth';
import { LoginSection } from '../components/LoginSection';
import { ScrapingConfig } from '../components/ScrapingConfig';
import { ReviewRange } from '../components/ReviewRange';
import { WebsiteFilter } from '../components/WebsiteFilter';
import { FieldSelector } from '../components/FieldSelector';
import { ScrapingControls } from '../components/ScrapingControls';
import { ProgressDisplay } from '../components/ProgressDisplay';
import { ResultsTable } from '../components/ResultsTable';
import { MapPin, AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<ScraperSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<ScrapingStatus>('IDLE');
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number | 'all'>(50);
  const [statusText, setStatusText] = useState<string>('Ready');
  const [businesses, setBusinesses] = useState<BusinessLead[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active tab status
  const [tabWarning, setTabWarning] = useState<string | null>(null);

  // CRM Auth State
  const [authState, setAuthState] = useState<CrmAuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
    crmUrl: 'http://localhost:3000',
  });

  // Table selection & Save Data state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatusMap, setSaveStatusMap] = useState<Record<string, 'imported' | 'duplicate' | 'failed'>>({});
  const [saveFeedbackMessage, setSaveFeedbackMessage] = useState<string | null>(null);

  // 1. Load saved settings and stored auth on mount
  useEffect(() => {
    loadSettings().then((loaded) => {
      setSettings(loaded);
      setTargetCount(loaded.countMode === 'custom' ? loaded.customCount : 'all');
    });

    getStoredAuth().then((auth) => {
      setAuthState(auth);
    });
  }, []);

  // 2. Persist settings when changed
  const updateSettings = useCallback((newSettings: ScraperSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // 3. Check active tab URL
  const checkActiveTab = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url) {
        setTabWarning('Please open a Google Maps search results page first.');
        return;
      }

      const isMaps = activeTab.url.includes('google.') && activeTab.url.includes('/maps');
      if (!isMaps) {
        setTabWarning('Please open a Google Maps search results page first.');
      } else {
        setTabWarning(null);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    checkActiveTab();
  }, [checkActiveTab]);

  // 4. Listen for Chrome runtime messages from Content Script
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      return;
    }

    const messageHandler = (message: ExtensionMessage) => {
      if (message.type === 'SCRAPING_PROGRESS') {
        setStatus('SCRAPING');
        setScannedCount(message.scannedCount);
        setMatchingCount(message.matchingCount);
        setTargetCount(message.targetCount);
        setStatusText(message.statusText);

        if (message.newBusinesses && message.newBusinesses.length > 0) {
          setBusinesses((prev) => {
            const existingIds = new Set(prev.map((b) => b.id));
            const fresh = message.newBusinesses.filter((b) => !existingIds.has(b.id));
            return [...prev, ...fresh];
          });
        }
      } else if (message.type === 'SCRAPING_COMPLETED') {
        setStatus('COMPLETED');
        setScannedCount(message.totalScanned);
        setMatchingCount(message.totalMatching);
        setStatusText('Scraping completed');
        setErrorMessage(null);
      } else if (message.type === 'SCRAPING_STOPPED') {
        setStatus('STOPPED');
        setScannedCount(message.totalScanned);
        setMatchingCount(message.totalMatching);
        setStatusText('Scraping stopped');
        setErrorMessage(null);
      } else if (message.type === 'SCRAPING_ERROR') {
        setStatus('ERROR');
        setErrorMessage(message.error);
        setStatusText('Scraping error');
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);
    return () => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    };
  }, []);

  // Settings change handlers
  const handleCountModeChange = (mode: ScrapeCountMode) => {
    const updated = { ...settings, countMode: mode };
    updateSettings(updated);
    setTargetCount(mode === 'custom' ? updated.customCount : 'all');
  };

  const handleCustomCountChange = (count: number) => {
    const updated = { ...settings, customCount: count };
    updateSettings(updated);
    if (settings.countMode === 'custom') {
      setTargetCount(count);
    }
  };

  const handleMinReviewsChange = (minReviews: number | null) => {
    updateSettings({ ...settings, minReviews });
  };

  const handleMaxReviewsChange = (maxReviews: number | null) => {
    updateSettings({ ...settings, maxReviews });
  };

  const handleWebsiteFilterChange = (websiteFilter: WebsiteFilterOption) => {
    updateSettings({ ...settings, websiteFilter });
  };

  const handleSelectedFieldsChange = (selectedFields: ScrapableFieldKey[]) => {
    updateSettings({ ...settings, selectedFields });
  };

  // Checkbox selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === businesses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(businesses.map((b) => b.id)));
    }
  };

  // Validation
  const validation = validateSettings(settings);
  const isScrapingActive = status === 'SCRAPING' || status === 'STOPPING';

  // Start Scraping Action
  const handleStartScraping = async () => {
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage(null);
    setStatus('SCRAPING');
    setScannedCount(0);
    setMatchingCount(0);
    setBusinesses([]); // Clear results for a brand-new run
    setSelectedIds(new Set());
    setSaveStatusMap({});
    setSaveFeedbackMessage(null);
    setTargetCount(settings.countMode === 'custom' ? settings.customCount : 'all');

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setErrorMessage('Chrome Extension APIs unavailable in preview mode.');
      setStatus('IDLE');
      return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!activeTab || !activeTab.id || !activeTab.url) {
        setStatus('ERROR');
        setErrorMessage('Please open a Google Maps search results page first.');
        return;
      }

      if (!activeTab.url.includes('google.') || !activeTab.url.includes('/maps')) {
        setStatus('ERROR');
        setErrorMessage('Please open a Google Maps search results page first.');
        return;
      }

      // Send start message to content script on active tab
      chrome.tabs.sendMessage(
        activeTab.id,
        {
          type: 'START_SCRAPING',
          settings,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            setStatus('ERROR');
            setErrorMessage(
              'Could not connect to Google Maps page. Please refresh the Google Maps tab and try again.'
            );
          } else if (response && response.status === 'already_running') {
            setStatusText('Scraper is already running on this tab.');
          }
        }
      );
    } catch (err) {
      setStatus('ERROR');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to communicate with Google Maps page.'
      );
    }
  };

  // Stop Scraping Action
  const handleStopScraping = async () => {
    setStatus('STOPPING');
    setStatusText('Stopping...');

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setStatus('STOPPED');
      return;
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'STOP_SCRAPING' });
      }
    } catch {
      setStatus('STOPPED');
    }
  };

  // Clear Results Action (Keeps extension Clear behavior intact)
  const handleClearResults = () => {
    if (isScrapingActive) return;
    setBusinesses([]);
    setSelectedIds(new Set());
    setSaveStatusMap({});
    setSaveFeedbackMessage(null);
    setScannedCount(0);
    setMatchingCount(0);
    setStatus('IDLE');
    setErrorMessage(null);
  };

  // CSV Export Action (Kept intact)
  const handleExportCsv = () => {
    if (businesses.length === 0) return;
    downloadCsv(businesses, settings.selectedFields);
  };

  // Save Data Action (Sends only selected businesses to CRM)
  const handleSaveData = async () => {
    if (!authState.isAuthenticated) {
      setSaveFeedbackMessage('CRM authentication required. Please connect your Client Hunting CRM account above.');
      return;
    }

    if (selectedIds.size === 0) {
      setSaveFeedbackMessage('Please select at least one business.');
      return;
    }

    const selectedBusinesses = businesses.filter((b) => selectedIds.has(b.id));
    if (selectedBusinesses.length === 0) {
      setSaveFeedbackMessage('Please select at least one business.');
      return;
    }

    setIsSaving(true);
    setSaveFeedbackMessage(null);

    const result = await importLeadsToCrm(selectedBusinesses, authState.crmUrl);
    setIsSaving(false);

    if (result.error) {
      setSaveFeedbackMessage(result.error);
    } else {
      setSaveFeedbackMessage(
        `Saved: ${result.imported} | Already Exists: ${result.duplicates} | Failed: ${result.failed}`
      );
    }

    if (result.results && result.results.length > 0) {
      setSaveStatusMap((prev) => {
        const next = { ...prev };
        for (const r of result.results) {
          next[r.id] = r.status;
        }
        return next;
      });
    }
  };

  return (
    <div className="app-container">
      {/* Sleek App Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon-wrap">
            <MapPin className="logo-icon" size={20} />
          </div>
          <div className="brand-info">
            <h1 className="brand-title">Google Maps Lead Scraper</h1>
            <p className="brand-subtitle">Personal Business Lead Research</p>
          </div>
        </div>

        <div className="header-badge-wrap">
          <span className={`status-tag status-${status.toLowerCase()}`}>
            {status}
          </span>
        </div>
      </header>

      {/* CRM Authentication Section */}
      <LoginSection
        authState={authState}
        onAuthChange={setAuthState}
      />

      {/* Google Maps Tab Notice */}
      {tabWarning && (
        <div className="tab-warning-banner">
          <AlertTriangle size={15} className="warning-icon" />
          <span>{tabWarning}</span>
          <button
            type="button"
            onClick={checkActiveTab}
            className="refresh-tab-btn"
            title="Recheck active tab"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      )}

      {/* Main Configuration Panel */}
      <main className="main-content">
        <div className="config-container">
          <ScrapingConfig
            countMode={settings.countMode}
            customCount={settings.customCount}
            disabled={isScrapingActive}
            onCountModeChange={handleCountModeChange}
            onCustomCountChange={handleCustomCountChange}
          />

          <ReviewRange
            minReviews={settings.minReviews}
            maxReviews={settings.maxReviews}
            disabled={isScrapingActive}
            onMinReviewsChange={handleMinReviewsChange}
            onMaxReviewsChange={handleMaxReviewsChange}
          />

          <WebsiteFilter
            value={settings.websiteFilter}
            disabled={isScrapingActive}
            onChange={handleWebsiteFilterChange}
          />

          <FieldSelector
            selectedFields={settings.selectedFields}
            disabled={isScrapingActive}
            onChange={handleSelectedFieldsChange}
          />

          <ScrapingControls
            status={status}
            isValid={validation.isValid}
            validationError={validation.error}
            onStart={handleStartScraping}
            onStop={handleStopScraping}
          />
        </div>

        {/* Real-time Progress Card */}
        <ProgressDisplay
          status={status}
          scannedCount={scannedCount}
          matchingCount={matchingCount}
          targetCount={targetCount}
          statusText={statusText}
          errorMessage={errorMessage}
        />

        {/* Results Table, Checkbox Selection & Save Data Bar */}
        <ResultsTable
          businesses={businesses}
          selectedFields={settings.selectedFields}
          isScrapingActive={isScrapingActive}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onSaveData={handleSaveData}
          isSaving={isSaving}
          saveStatusMap={saveStatusMap}
          saveFeedbackMessage={saveFeedbackMessage}
          onClearResults={handleClearResults}
          onExportCsv={handleExportCsv}
        />
      </main>

      {/* Clean Footer */}
      <footer className="app-footer">
        <span>Client Hunting CRM Connected • Local browser scraping</span>
      </footer>
    </div>
  );
};
