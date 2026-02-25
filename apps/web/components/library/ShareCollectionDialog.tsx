'use client';

import { useState, useEffect } from 'react';
import { UserPlus, X, Loader2 } from 'lucide-react';
import {
  inviteToCollectionAction,
  getCollectionMembersAction,
  removeMemberAction,
  updateMemberRoleAction,
  revokeInvitationAction,
} from '@/app/actions/collection-sharing';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

type Member = {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: Date;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
};

type ShareCollectionDialogProps = {
  collectionId: string;
  collectionName: string;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareCollectionDialog({
  collectionId,
  collectionName,
  isOwner,
  open,
  onOpenChange,
}: ShareCollectionDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    getCollectionMembersAction(collectionId).then((result) => {
      if (result.success) {
        setMembers(result.members);
        setInvitations(result.invitations);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [open, collectionId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSending(true);

    const result = await inviteToCollectionAction({
      collectionId,
      email: email.trim(),
      role,
    });

    if (result.success) {
      addToast({ variant: 'success', title: 'Invitation sent' });
      setEmail('');
      // Refresh members
      const refreshed = await getCollectionMembersAction(collectionId);
      if (refreshed.success) {
        setMembers(refreshed.members);
        setInvitations(refreshed.invitations);
      }
    } else {
      addToast({ variant: 'error', title: result.message });
    }
    setIsSending(false);
  };

  const handleRemoveMember = async (userId: string) => {
    const result = await removeMemberAction({ collectionId, userId });
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      addToast({ variant: 'success', title: 'Member removed' });
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    const result = await updateMemberRoleAction({ collectionId, userId, role: newRole });
    if (result.success) {
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
      addToast({ variant: 'success', title: 'Role updated' });
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    const result = await revokeInvitationAction(invitationId);
    if (result.success) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      addToast({ variant: 'success', title: 'Invitation revoked' });
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{collectionName}&rdquo;</DialogTitle>
          <DialogDescription>
            Invite others to collaborate on this collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite form - only for owners */}
          {isOwner && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                className="rounded-md border bg-background px-2 py-2 text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <Button type="submit" size="sm" disabled={isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </form>
          )}

          {/* Members list */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              Members ({members.length})
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-10 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name || member.email}
                      </p>
                      {member.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {member.role === 'owner' ? (
                        <span className="text-xs font-medium text-primary">Owner</span>
                      ) : isOwner ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(member.userId, e.target.value as 'editor' | 'viewer')
                            }
                            className="rounded border bg-background px-1.5 py-0.5 text-xs"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                            aria-label="Remove member"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground capitalize">
                          {member.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending invitations */}
          {isOwner && invitations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                Pending Invitations ({invitations.length})
              </h4>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-md border border-dashed p-2"
                  >
                    <div>
                      <p className="text-sm truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{inv.role}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleRevokeInvitation(inv.id)}
                      aria-label="Revoke invitation"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
