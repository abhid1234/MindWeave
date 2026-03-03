import '@/app/globals.css';

export default function EmbedCollectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-transparent">{children}</body>
    </html>
  );
}
