export default function ScreeningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        {children}
      </div>
    </div>
  );
}
