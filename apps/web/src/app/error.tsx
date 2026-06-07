"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-destructive">Something went wrong</h1>
        <p className="text-muted-foreground mt-2 mb-6">
          {error.message || "An unexpected error occurred"}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
