'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getDigestSettingsAction,
  updateDigestSettingsAction,
  type DigestSettingsData,
} from '@/app/actions/digest';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${hour}:00 ${ampm}` };
});

export function DigestSettingsForm() {
  const [settings, setSettings] = useState<DigestSettingsData>({
    enabled: false,
    frequency: 'weekly',
    preferredDay: 1,
    preferredHour: 9,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const result = await getDigestSettingsAction();
    if (result.success) {
      setSettings(result.settings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const result = await updateDigestSettingsAction(settings);
    setSaving(false);
    setMessage(result.message);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Email Digest</h2>
        </div>
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Email Digest</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Get a summary of your recent captures and AI-discovered topics delivered to your inbox.
      </p>

      <div className="space-y-4">
        {/* Enable toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) =>
              setSettings((s) => ({ ...s, enabled: e.target.checked }))
            }
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium">
            {settings.enabled ? 'Digest enabled' : 'Enable digest emails'}
          </span>
        </label>

        {settings.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-7">
            {/* Frequency */}
            <div className="space-y-1.5">
              <label
                htmlFor="digest-frequency"
                className="text-xs font-medium text-muted-foreground"
              >
                Frequency
              </label>
              <select
                id="digest-frequency"
                value={settings.frequency}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, frequency: e.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Day (only for weekly) */}
            {settings.frequency === 'weekly' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="digest-day"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Day
                </label>
                <select
                  id="digest-day"
                  value={settings.preferredDay}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      preferredDay: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DAYS.map((day, i) => (
                    <option key={day} value={i}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hour */}
            <div className="space-y-1.5">
              <label
                htmlFor="digest-hour"
                className="text-xs font-medium text-muted-foreground"
              >
                Time (UTC)
              </label>
              <select
                id="digest-hour"
                value={settings.preferredHour}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    preferredHour: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {HOURS.map((hour) => (
                  <option key={hour.value} value={hour.value}>
                    {hour.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    </div>
  );
}
