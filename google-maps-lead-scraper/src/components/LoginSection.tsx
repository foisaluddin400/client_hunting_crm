import React, { useState } from 'react';
import { CrmAuthState, loginToCrm, logoutFromCrm } from '../auth/crmAuth';
import { ShieldCheck, ShieldAlert, LogIn, LogOut, Loader2, ChevronDown, ChevronUp, Server } from 'lucide-react';

interface LoginSectionProps {
  authState: CrmAuthState;
  onAuthChange: (state: CrmAuthState) => void;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ authState, onAuthChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [crmUrl, setCrmUrl] = useState(authState.crmUrl || 'http://localhost:3000');
  const [showUrlField, setShowUrlField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginToCrm(email, password, crmUrl);
    setIsLoading(false);

    if (result.success && result.user) {
      onAuthChange({
        isAuthenticated: true,
        token: 'active',
        user: result.user,
        crmUrl,
      });
      setPassword('');
      setIsExpanded(false);
    } else {
      setErrorMessage(result.error || 'Failed to connect to Client Hunting CRM.');
    }
  };

  const handleLogout = async () => {
    await logoutFromCrm();
    onAuthChange({
      isAuthenticated: false,
      token: null,
      user: null,
      crmUrl,
    });
  };

  return (
    <div className="crm-auth-card">
      {/* Auth Status Header Bar */}
      <div className="crm-auth-header">
        <div className="crm-auth-status-info">
          {authState.isAuthenticated ? (
            <div className="status-indicator-badge connected">
              <ShieldCheck size={14} className="badge-icon" />
              <span className="badge-label">Connected to Client Hunting CRM</span>
            </div>
          ) : (
            <div className="status-indicator-badge disconnected">
              <ShieldAlert size={14} className="badge-icon" />
              <span className="badge-label">CRM Not Connected (Save Data Disabled)</span>
            </div>
          )}
        </div>

        {authState.isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="crm-logout-btn"
            title="Log out from CRM"
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="crm-toggle-btn"
          >
            <span>{isExpanded ? 'Cancel' : 'Login'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Connected User Summary */}
      {authState.isAuthenticated && authState.user && (
        <div className="crm-user-info">
          <span className="user-name">{authState.user.name || 'CRM User'}</span>
          <span className="user-email">({authState.user.email})</span>
        </div>
      )}

      {/* Unauthenticated Login Form Drawer */}
      {!authState.isAuthenticated && isExpanded && (
        <form onSubmit={handleLogin} className="crm-login-form">
          <p className="login-instructions">
            Enter your <strong>Client Hunting CRM</strong> credentials to save scraped leads directly to your database.
          </p>

          {errorMessage && (
            <div className="crm-login-error">
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="crm-email-input">CRM Email</label>
            <input
              id="crm-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@apexgrowth.io"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="crm-password-input">Password</label>
            <input
              id="crm-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          <div className="crm-url-toggle">
            <button
              type="button"
              onClick={() => setShowUrlField(!showUrlField)}
              className="text-toggle-btn"
            >
              <Server size={11} />
              <span>{showUrlField ? 'Hide Server URL' : 'Server URL Settings'}</span>
            </button>
          </div>

          {showUrlField && (
            <div className="form-group">
              <label htmlFor="crm-url-input">CRM Server URL</label>
              <input
                id="crm-url-input"
                type="text"
                value={crmUrl}
                onChange={(e) => setCrmUrl(e.target.value)}
                placeholder="http://localhost:3000"
                disabled={isLoading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="crm-login-submit-btn"
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="spin-icon" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <LogIn size={13} />
                <span>Connect CRM</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
