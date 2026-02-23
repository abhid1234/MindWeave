'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  listApiKeysAction,
  createApiKeyAction,
  revokeApiKeyAction,
  type ApiKeyListItem,
} from '@/app/actions/api-keys';
import { formatDateUTC } from '@/lib/utils';

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    const result = await listApiKeysAction();
    if (result.success) {
      setKeys(result.keys);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    setCreating(true);
    const result = await createApiKeyAction({
      name: newKeyName,
      expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : undefined,
    });
    setCreating(false);

    if (result.success && result.rawKey) {
      setNewRawKey(result.rawKey);
      loadKeys();
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    const result = await revokeApiKeyAction(keyId);
    setRevoking(null);
    if (result.success) {
      loadKeys();
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setNewKeyName('');
    setExpiresInDays('');
    setNewRawKey(null);
    setCopied(false);
  };

  const activeKeys = keys.filter((k) => k.isActive);
  const revokedKeys = keys.filter((k) => !k.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">API Keys</h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Key
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Use API keys to access Mindweave programmatically. Keys are shown only once at creation.
      </p>

      {loading ? (
        <div className="space-y-2">
          <div className="h-14 rounded-lg bg-muted animate-pulse" />
          <div className="h-14 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : activeKeys.length === 0 && revokedKeys.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No API keys yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {activeKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{key.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{key.keyPrefix}...</span>
                  <span>
                    Created {formatDateUTC(key.createdAt)}
                  </span>
                  {key.lastUsedAt && (
                    <span>
                      Last used {formatDateUTC(key.lastUsedAt)}
                    </span>
                  )}
                  {key.expiresAt && (
                    <span>
                      Expires {formatDateUTC(key.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRevoke(key.id)}
                disabled={revoking === key.id}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Revoke</span>
              </Button>
            </div>
          ))}

          {revokedKeys.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Revoked</p>
              {revokedKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-2 opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-through">{key.name}</p>
                    <span className="text-xs font-mono text-muted-foreground">
                      {key.keyPrefix}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Key Dialog */}
      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {newRawKey ? 'API Key Created' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {newRawKey
                ? 'Copy your key now. It won\'t be shown again.'
                : 'Give your key a name so you can identify it later.'}
            </DialogDescription>
          </DialogHeader>

          {newRawKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This key will only be shown once. Store it securely.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono break-all">
                  {newRawKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(newRawKey)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreate}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="keyName" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Browser Extension, CLI Tool"
                  disabled={creating}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="expiresIn" className="text-sm font-medium">
                  Expires in (days, optional)
                </label>
                <Input
                  id="expiresIn"
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="Leave blank for no expiration"
                  min={1}
                  max={365}
                  disabled={creating}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseCreate}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newKeyName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
