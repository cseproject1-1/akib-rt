"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { RotateCcw, AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4">
            <div className="relative flex flex-col items-center justify-center space-y-6 text-center max-w-md">
                {/* Glow effect */}
                <div className="absolute -z-10 h-[300px] w-[300px] rounded-full bg-red-500/10 blur-[100px]" />

                <div className="h-20 w-20 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                    <AlertCircle className="h-10 w-10" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
                    <p className="text-muted-foreground">
                        We encountered an unexpected error. Our team has been notified.
                    </p>
                    {error.digest && (
                        <p className="text-xs font-mono text-muted-foreground/50">Error ID: {error.digest}</p>
                    )}
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <Button
                        onClick={() => reset()}
                        className="h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0 px-8 font-bold transition-all"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                </div>
            </div>
        </div>
    );
}
