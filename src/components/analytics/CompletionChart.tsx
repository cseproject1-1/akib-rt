"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTask } from "@/context/TaskContext";
import { format, subDays } from "date-fns";

export const CompletionChart = () => {
  const { tasks } = useTask();

  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: date,
        dateStr: format(date, "yyyy-MM-dd"),
        dayName: format(date, "EEE"),
        fullLabel: format(date, "MMM dd"),
      };
    });

    return last7Days.map((day) => {
      let totalScheduled = 0;
      let totalCompleted = 0;

      tasks.forEach((task) => {
        // Check if task was scheduled for this day (based on day name e.g., "MON")
        const dayOfWeek = format(day.date, "EEE").toUpperCase();
        if (task.days.includes(dayOfWeek)) {
          totalScheduled++;
          if (task.completionHistory.includes(day.dateStr)) {
            totalCompleted++;
          }
        }
      });

      const percentage =
        totalScheduled > 0
          ? Math.round((totalCompleted / totalScheduled) * 100)
          : 0;

      return {
        name: day.dayName,
        fullLabel: day.fullLabel,
        completion: percentage,
      };
    });
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-border bg-card p-4 text-muted-foreground">
        Add tasks to see analytics
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Last 7 Days Completion
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#aaa", marginBottom: "4px" }}
            formatter={(value: any) => [`${value}%`, "Completion"]}
          />
          <Line
            type="monotone"
            dataKey="completion"
            stroke="#a855f7" // Purple-500
            strokeWidth={3}
            dot={{ r: 4, fill: "#a855f7" }}
            activeDot={{ r: 6, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
