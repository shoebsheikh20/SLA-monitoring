import { useState } from 'react';
import { User, Settings as SettingsIcon, Bell, Palette, Save, Eye, EyeOff } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

type Section = 'account' | 'monitoring' | 'notifications' | 'appearance';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('account');
  const [saving, setSaving] = useState(false);

  // Account form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Monitoring settings (UI only - would be stored in DB/env in production)
  const [monitoringInterval, setMonitoringInterval] = useState(30);
  const [defaultLatency, setDefaultLatency] = useState(500);
  const [defaultPageLoad, setDefaultPageLoad] = useState(2.0);
  const [dataRetention, setDataRetention] = useState(30);

  // Notifications
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [slaBreachAlerts, setSlaBreachAlerts] = useState(true);

  // Appearance
  const [compactMode, setCompactMode] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const t = (window as unknown as { __toast: { success: (m: string) => void; error: (m: string) => void } }).__toast;
    if (t) t[type](message);
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const res = await authService.updateProfile({
        name: name !== user?.name ? name : undefined,
        email: email !== user?.email ? email : undefined,
        currentPassword: currentPwd || undefined,
        newPassword: newPwd || undefined,
      });
      updateUser(res.user);
      setCurrentPwd('');
      setNewPwd('');
      showToast('success', 'Profile updated successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showToast('error', msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const sections: { id: Section; label: string; icon: typeof User }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'monitoring', label: 'Monitoring', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Manage your account and application preferences</p>
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">
        {/* Sidebar nav */}
        <GlassCard nohover className="lg:w-[200px] flex-shrink-0 p-3">
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full sidebar-item ${activeSection === id ? 'active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </GlassCard>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {activeSection === 'account' && (
            <GlassCard nohover>
              <h3 className="text-base font-semibold text-text-primary mb-5">Account Settings</h3>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-glass" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" />
                </div>
                <div className="border-t border-glass-border pt-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Change Password</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Current Password</label>
                      <div className="relative">
                        <input type={showPwd ? 'text' : 'password'} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="input-glass pr-10" placeholder="Enter current password" />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">New Password</label>
                      <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="input-glass" placeholder="Enter new password" />
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveAccount} disabled={saving} className="btn-primary">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </GlassCard>
          )}

          {activeSection === 'monitoring' && (
            <GlassCard nohover>
              <h3 className="text-base font-semibold text-text-primary mb-5">Monitoring Configuration</h3>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                    Monitoring Interval (seconds)
                  </label>
                  <input type="number" value={monitoringInterval} onChange={(e) => setMonitoringInterval(parseInt(e.target.value))} min={10} max={300} className="input-glass" />
                  <p className="text-xs text-text-muted mt-1">How often the simulator generates new metrics (10–300s)</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                    Default Latency SLA (ms)
                  </label>
                  <input type="number" value={defaultLatency} onChange={(e) => setDefaultLatency(parseInt(e.target.value))} min={1} className="input-glass" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                    Default Page Load SLA (s)
                  </label>
                  <input type="number" value={defaultPageLoad} onChange={(e) => setDefaultPageLoad(parseFloat(e.target.value))} step={0.1} min={0.1} className="input-glass" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                    Data Retention (days)
                  </label>
                  <input type="number" value={dataRetention} onChange={(e) => setDataRetention(parseInt(e.target.value))} min={1} max={365} className="input-glass" />
                  <p className="text-xs text-text-muted mt-1">Metrics older than this will be automatically deleted</p>
                </div>
                <div className="bg-iris/8 border border-iris/15 rounded-xl p-3 text-xs text-text-muted">
                  Note: These settings will take effect after restarting the backend server. Edit your <code className="text-iris-bright">server/.env</code> file to persist them.
                </div>
                <button onClick={() => showToast('success', 'Settings saved (restart server to apply)')} className="btn-primary">
                  <Save size={14} /> Save Settings
                </button>
              </div>
            </GlassCard>
          )}

          {activeSection === 'notifications' && (
            <GlassCard nohover>
              <h3 className="text-base font-semibold text-text-primary mb-5">Notification Preferences</h3>
              <div className="space-y-4 max-w-lg">
                {[
                  { label: 'Enable all alerts', sub: 'Receive alerts for all events', value: enableAlerts, set: setEnableAlerts },
                  { label: 'Critical alerts', sub: 'Get notified for critical SLA breaches', value: criticalAlerts, set: setCriticalAlerts },
                  { label: 'SLA breach alerts', sub: 'Alerts when services breach SLA thresholds', value: slaBreachAlerts, set: setSlaBreachAlerts },
                ].map(({ label, sub, value, set }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-glass-border last:border-0">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{label}</div>
                      <div className="text-xs text-text-muted">{sub}</div>
                    </div>
                    <button
                      onClick={() => set(!value)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-iris' : 'bg-glass-border'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
                <button onClick={() => showToast('success', 'Notification preferences saved')} className="btn-primary">
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            </GlassCard>
          )}

          {activeSection === 'appearance' && (
            <GlassCard nohover>
              <h3 className="text-base font-semibold text-text-primary mb-5">Appearance</h3>
              <div className="space-y-4 max-w-lg">
                <div className="p-4 rounded-xl bg-iris/8 border border-iris/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-iris-pink flex items-center justify-center">
                      <Palette size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">Dark Glassmorphism</div>
                      <div className="text-xs text-text-muted">Current theme · Active</div>
                    </div>
                    <span className="ml-auto badge badge-healthy text-[10px]">Active</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <div className="w-5 h-5 rounded-full bg-dark-bg border border-white/20" title="Dark Blue" />
                    <div className="w-5 h-5 rounded-full bg-iris" title="Iris" />
                    <div className="w-5 h-5 rounded-full bg-pink" title="Pink" />
                    <div className="w-5 h-5 rounded-full bg-dark-navy border border-iris/20" title="Navy" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-glass-border">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Compact Dashboard</div>
                    <div className="text-xs text-text-muted">Reduce padding and font sizes</div>
                  </div>
                  <button
                    onClick={() => setCompactMode(!compactMode)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${compactMode ? 'bg-iris' : 'bg-glass-border'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${compactMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="text-xs text-text-muted p-3 bg-dark-bg/50 rounded-xl">
                  The dark glassmorphism theme cannot be changed. It is the core design of SLA Pulse.
                </div>

                <button onClick={() => showToast('success', 'Appearance settings saved')} className="btn-primary">
                  <Save size={14} /> Save Appearance
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
