"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Home, MoveLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <div className="relative flex flex-col items-center justify-center space-y-6 text-center">
                {/* Glow effect */}
                <div className="absolute -z-10 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[100px]" />

                <h1 className="text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-pink-600">
                    404
                </h1>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
                    <p className="text-muted-foreground max-w-[400px]">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <Link href="/">
                        <Button className="h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 font-bold text-white shadow-lg shadow-purple-500/20 hover:scale-105 transition-all">
                            <Home className="mr-2 h-4 w-4" />
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
