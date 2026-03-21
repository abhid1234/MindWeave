'use client';

import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShareButton } from './ShareButton';

interface ShareNudgeProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  actionType: string;
}

export function ShareNudge({
  open,
  onClose,
  title,
  url,
  actionType: _actionType,
}: ShareNudgeProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Nice work!
          </DialogTitle>
          <DialogDescription>Share this with your network?</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-muted-foreground text-sm">{title}</p>
          <div className="flex items-center gap-3">
            <ShareButton url={url} title={title} variant="default" size="default" />
            <Button variant="ghost" onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
