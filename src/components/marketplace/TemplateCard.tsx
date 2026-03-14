"use client";

import React from "react";
import { Button, cn } from "@/components/ui/Button";
import { Download, Star, Clock, Calendar } from "lucide-react";
import { MarketplaceTemplate } from "@/data/marketplaceTemplates";

interface TemplateCardProps {
    template: MarketplaceTemplate;
    onPreview: (template: MarketplaceTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
    template,
    onPreview,
}) => {
    const totalTime = template.tasks.reduce((acc, task) => {
        const [startH, startM] = task.startTime.split(":").map(Number);
        const [endH, endM] = task.endTime.split(":").map(Number);
        let duration = (endH * 60 + endM) - (startH * 60 + startM);
        if (duration < 0) duration += 24 * 60; // Handle overnight tasks
        return acc + duration;
    }, 0);

    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl cursor-pointer",
                template.featured
                    ? "border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5"
                    : "border-white/10 bg-white/[0.03] hover:border-purple-500/30 hover:bg-white/[0.05]"
            )}
            onClick={() => onPreview(template)}
        >
            {/* Featured Badge */}
            {template.featured && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-widest">
                    <Star className="h-3 w-3" />
                    Featured
                </div>
            )}

            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-3xl shadow-inner shrink-0">
                        {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold tracking-tight text-white truncate">
                            {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {template.category}
                            </span>
                            <span className="text-xs text-muted-foreground">by {template.author}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{template.tasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{hours > 0 ? `${hours}h ` : ""}{minutes > 0 ? `${minutes}m` : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Download className="h-3.5 w-3.5" />
                        <span>{template.downloads.toLocaleString()}</span>
                    </div>
                </div>

                {/* Preview Button */}
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(template);
                    }}
                    className="w-full h-12 rounded-2xl bg-white/5 hover:bg-purple-500 text-white font-bold border-0 transition-all group-hover:bg-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/20"
                >
                    Preview Template
                </Button>
            </div>
        </div>
    );
};
