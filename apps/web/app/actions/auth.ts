'use server';

import { signOut as authSignOut } from '@/lib/auth';

export async function signOutAction() {
  await authSignOut({ redirectTo: '/' });
}
