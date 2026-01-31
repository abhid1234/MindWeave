'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { deleteTaskAction } from '@/app/actions/tasks';

type DeleteTaskDialogProps = {
  taskId: string;
  taskTitle: string;
  trigger: React.ReactNode;
};

export function DeleteTaskDialog({ taskId, taskTitle, trigger }: DeleteTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (result.success) {
        addToast({ title: result.message, variant: 'success' });
        setOpen(false);
      } else {
        addToast({ title: result.message, variant: 'error' });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete &quot;{taskTitle}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
