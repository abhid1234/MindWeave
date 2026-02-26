'use client';

import { useState, useEffect, useCallback } from 'react';
import { Webhook, Plus, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  getWebhookConfigsAction,
  updateWebhookConfigAction,
  deleteWebhookConfigAction,
} from '@/app/actions/webhooks';
import { WebhookCreateDialog } from './WebhookCreateDialog';
import { formatDateUTC } from '@/lib/utils';

type WebhookConfigItem = {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  lastReceivedAt: Date | null;
  totalReceived: number;
  createdAt: Date;
};

export function WebhookManager() {
  const [configs, setConfigs] = useState<WebhookConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { addToast } = useToast();

  const fetchConfigs = useCallback(async () => {
    const result = await getWebhookConfigsAction();
    if (result.success) {
      setConfigs(result.configs);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    const result = await updateWebhookConfigAction(id, { isActive: !currentlyActive });
    if (result.success) {
      addToast({ variant: 'success', title: currentlyActive ? 'Webhook disabled' : 'Webhook enabled' });
      fetchConfigs();
    } else {
      addToast({ variant: 'error', title: 'Failed', description: result.message });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteWebhookConfigAction(id);
    if (result.success) {
      addToast({ variant: 'success', title: 'Webhook deleted' });
      fetchConfigs();
    } else {
      addToast({ variant: 'error', title: 'Failed', description: result.message });
    }
  };

  const getWebhookUrl = (type: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    switch (type) {
      case 'slack':
        return `${base}/api/webhooks/slack`;
      case 'discord':
        return `${base}/api/webhooks/discord`;
      default:
        return `${base}/api/webhooks/capture`;
    }
  };

  const handleCopyUrl = (type: string) => {
    navigator.clipboard.writeText(getWebhookUrl(type));
    addToast({ variant: 'success', title: 'URL copied to clipboard' });
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'slack':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'discord':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Webhook Integrations</h2>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Connect external services to automatically capture content in Mindweave.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">No webhooks configured yet.</p>
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{config.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getTypeBadgeClass(config.type)}`}
                    >
                      {config.type}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        config.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{config.totalReceived} received</span>
                    {config.lastReceivedAt && (
                      <span>Last: {formatDateUTC(new Date(config.lastReceivedAt))}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleCopyUrl(config.type)}
                  aria-label="Copy webhook URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleToggleActive(config.id, config.isActive)}
                  aria-label={config.isActive ? 'Disable webhook' : 'Enable webhook'}
                >
                  {config.isActive ? (
                    <ToggleRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(config.id)}
                  aria-label="Delete webhook"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup instructions */}
      <div className="mt-6 rounded-lg border bg-muted/50 p-4">
        <h3 className="text-sm font-medium mb-2">Setup Instructions</h3>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Generic:</strong> Send a POST request with a Bearer token (your API key) to{' '}
            <code className="bg-muted px-1 rounded">/api/webhooks/capture</code> with{' '}
            <code className="bg-muted px-1 rounded">{'{ title, body?, url?, tags?, type? }'}</code>.
          </p>
          <p>
            <strong>Slack:</strong> Create a Slack app, enable Events API, set the Request URL to{' '}
            <code className="bg-muted px-1 rounded">/api/webhooks/slack</code>, and subscribe to{' '}
            <code className="bg-muted px-1 rounded">message.channels</code> events. Add the Signing Secret above.
          </p>
          <p>
            <strong>Discord:</strong> Create a Discord application, set the Interactions Endpoint URL to{' '}
            <code className="bg-muted px-1 rounded">/api/webhooks/discord</code>. Add the Public Key above.
          </p>
        </div>
      </div>

      <WebhookCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchConfigs}
      />
    </div>
  );
}
