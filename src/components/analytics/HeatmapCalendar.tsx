"use client";

import React, { useMemo, useState } from "react";
import { useAnalytics } from "@/context/AnalyticsContext";
import { format, subDays, startOfWeek, addDays, getDay } from "date-fns";

interface HeatmapCalendarProps {
    days?: number;
    showMonthLabels?: boolean;
    showWeekLabels?: boolean;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
    days = 365,
    showMonthLabels = true,
    showWeekLabels = true,
}) => {
    const { getHeatmapData } = useAnalytics();
    const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    const heatmapData = useMemo(() => getHeatmapData(days), [getHeatmapData, days]);

    // Organize data into weeks (columns)
    const weeks = useMemo(() => {
        const weeksArray: (typeof heatmapData[0] | null)[][] = [];
        const today = new Date();
        const startDate = subDays(today, days - 1);

        // Find the start of the week containing startDate
        const firstWeekStart = startOfWeek(startDate, { weekStartsOn: 0 });

        // Calculate total weeks needed
        const totalDays = days + getDay(startDate);
        const numWeeks = Math.ceil(totalDays / 7);

        // Build weeks array
        let dataIndex = 0;
        for (let week = 0; week < numWeeks; week++) {
            const weekData: (typeof heatmapData[0] | null)[] = [];

            for (let day = 0; day < 7; day++) {
                const currentDate = addDays(firstWeekStart, week * 7 + day);

                if (currentDate < startDate || currentDate > today) {
                    weekData.push(null);
                } else if (dataIndex < heatmapData.length) {
                    weekData.push(heatmapData[dataIndex]);
                    dataIndex++;
                } else {
                    weekData.push(null);
                }
            }

            weeksArray.push(weekData);
        }

        return weeksArray;
    }, [heatmapData, days]);

    // Month labels
    const monthLabels = useMemo(() => {
        const labels: { label: string; position: number }[] = [];
        let lastMonth = "";

        weeks.forEach((week, weekIndex) => {
            const firstValidDay = week.find(d => d !== null);
            if (firstValidDay) {
                const month = format(new Date(firstValidDay.date), "MMM");
                if (month !== lastMonth) {
                    labels.push({ label: month, position: weekIndex });
                    lastMonth = month;
                }
            }
        });

        return labels;
    }, [weeks]);

    const levelColors = [
        "bg-white/5",           // Level 0 - No activity
        "bg-emerald-900/50",    // Level 1 - Low
        "bg-emerald-700/70",    // Level 2 - Medium
        "bg-emerald-500/80",    // Level 3 - High
        "bg-emerald-400",       // Level 4 - Max
    ];

    const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="relative">
            {/* Month Labels */}
            {showMonthLabels && (
                <div className="flex mb-2 ml-8" style={{ gap: "0px" }}>
                    {monthLabels.map((m, i) => (
                        <div
                            key={i}
                            className="text-[10px] font-medium text-muted-foreground"
                            style={{
                                marginLeft: i === 0 ? `${m.position * 12}px` : `${(m.position - (monthLabels[i - 1]?.position || 0) - 1) * 12}px`,
                                minWidth: "24px"
                            }}
                        >
                            {m.label}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex">
                {/* Week Day Labels */}
                {showWeekLabels && (
                    <div className="flex flex-col gap-[2px] mr-2 pt-0">
                        {weekDayLabels.map((day, i) => (
                            <div
                                key={day}
                                className="h-[10px] text-[9px] font-medium text-muted-foreground flex items-center justify-end pr-1"
                                style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                )}

                {/* Heatmap Grid */}
                <div className="flex gap-[2px]">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[2px]">
                            {week.map((day, dayIndex) => (
                                <div
                                    key={dayIndex}
                                    className={`
                    w-[10px] h-[10px] rounded-[2px] transition-all duration-200
                    ${day ? levelColors[day.level] : "bg-transparent"}
                    ${day ? "hover:ring-2 hover:ring-purple-500/50 hover:scale-110 cursor-pointer" : ""}
                  `}
                                    onMouseEnter={(e) => {
                                        if (day) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHoveredDay({
                                                date: day.date,
                                                count: day.count,
                                                x: rect.left + rect.width / 2,
                                                y: rect.top
                                            });
                                        }
                                    }}
                                    onMouseLeave={() => setHoveredDay(null)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tooltip */}
            {hoveredDay && (
                <div
                    className="fixed z-50 px-3 py-2 text-xs font-medium bg-popover border border-border rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{ left: hoveredDay.x, top: hoveredDay.y - 8 }}
                >
                    <div className="text-foreground font-bold">{hoveredDay.count} tasks</div>
                    <div className="text-muted-foreground">
                        {format(new Date(hoveredDay.date), "MMM d, yyyy")}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 ml-8">
                <span className="text-[10px] text-muted-foreground">Less</span>
                {levelColors.map((color, i) => (
                    <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${color}`} />
                ))}
                <span className="text-[10px] text-muted-foreground">More</span>
            </div>
        </div>
    );
};
