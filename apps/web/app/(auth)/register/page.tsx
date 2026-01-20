import { redirect } from 'next/navigation';

// For now, registration uses the same OAuth flow as login
export default function RegisterPage() {
  redirect('/login');
}
