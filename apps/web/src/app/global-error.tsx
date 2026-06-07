"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-destructive">Critical Error</h1>
          <p className="text-muted-foreground mt-2 mb-6">
            A critical error occurred. Please try refreshing the page.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
              Go Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
