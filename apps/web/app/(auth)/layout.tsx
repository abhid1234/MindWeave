export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* Gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl animate-drift" />
        <div className="absolute top-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl animate-drift drift-delay-1" />
        <div className="absolute -bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-green-500/5 blur-3xl animate-drift drift-delay-2" />
      </div>
      {children}
    </div>
  );
}
