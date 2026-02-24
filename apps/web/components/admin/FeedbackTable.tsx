'use client';

import { useState } from 'react';
import { updateFeedbackStatusAction } from '@/app/actions/feedback';

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  status: string;
  email: string | null;
  page: string | null;
  createdAt: Date;
}

const STATUS_OPTIONS = ['new', 'reviewed', 'in_progress', 'resolved', 'dismissed'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export function FeedbackTable({ initialItems }: { initialItems: FeedbackItem[] }) {
  const [items, setItems] = useState(initialItems);

  async function handleStatusChange(feedbackId: string, newStatus: string) {
    const result = await updateFeedbackStatusAction(feedbackId, newStatus);
    if (result.success) {
      setItems(prev =>
        prev.map(item =>
          item.id === feedbackId ? { ...item, status: newStatus } : item
        )
      );
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No feedback yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Type</th>
            <th className="p-3 text-left font-medium">Message</th>
            <th className="p-3 text-left font-medium">Status</th>
            <th className="p-3 text-left font-medium">Email</th>
            <th className="p-3 text-left font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-3 capitalize">{item.type}</td>
              <td className="p-3 max-w-md truncate">{item.message}</td>
              <td className="p-3">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className={`rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-muted-foreground">{item.email || '\u2014'}</td>
              <td className="p-3 text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
