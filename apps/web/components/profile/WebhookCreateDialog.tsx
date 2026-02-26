'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createWebhookConfigAction } from '@/app/actions/webhooks';
import { useToast } from '@/components/ui/toast';

type WebhookCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function WebhookCreateDialog({ open, onOpenChange, onSuccess }: WebhookCreateDialogProps) {
  const [type, setType] = useState<'generic' | 'slack' | 'discord'>('generic');
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [defaultTags, setDefaultTags] = useState('');
  const [contentType, setContentType] = useState<'note' | 'link'>('note');
  const [channels, setChannels] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      addToast({ variant: 'warning', title: 'Name is required' });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createWebhookConfigAction({
        type,
        name: name.trim(),
        secret: secret.trim() || undefined,
        config: {
          defaultTags: defaultTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          contentType,
          channels: channels
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
        },
      });

      if (result.success) {
        addToast({ variant: 'success', title: 'Webhook created' });
        onOpenChange(false);
        setName('');
        setSecret('');
        setDefaultTags('');
        setChannels('');
        onSuccess();
      } else {
        addToast({ variant: 'error', title: 'Failed', description: result.message });
      }
    } catch {
      addToast({ variant: 'error', title: 'Failed to create webhook' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Set up a webhook to automatically capture content from external services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'generic' | 'slack' | 'discord')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="webhook-type-select"
            >
              <option value="generic">Generic (API)</option>
              <option value="slack">Slack</option>
              <option value="discord">Discord</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Slack Workspace"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="webhook-name-input"
            />
          </div>

          {(type === 'slack' || type === 'discord') && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {type === 'slack' ? 'Signing Secret' : 'Public Key'}
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={type === 'slack' ? 'Slack signing secret' : 'Discord public key'}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {type === 'slack'
                  ? 'Found in your Slack app settings under "Signing Secret".'
                  : 'Found in your Discord application settings under "Public Key".'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Default Tags</label>
            <input
              type="text"
              value={defaultTags}
              onChange={(e) => setDefaultTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tags automatically added to captured content (comma-separated).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'note' | 'link')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="note">Note</option>
              <option value="link">Link</option>
            </select>
          </div>

          {(type === 'slack' || type === 'discord') && (
            <div>
              <label className="block text-sm font-medium mb-1">Channel Filter (optional)</label>
              <input
                type="text"
                value={channels}
                onChange={(e) => setChannels(e.target.value)}
                placeholder="channel-id-1, channel-id-2"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only capture messages from these channels (comma-separated IDs). Leave empty for all.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Webhook'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
