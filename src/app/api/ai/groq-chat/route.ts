import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rateLimit";
import { sanitizePlainText } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

// System prompt for the AI assistant (same as Gemini)
const SYSTEM_PROMPT = `You are "Routine AI", a helpful assistant for a routine tracking app. You help users:
1. Create new tasks with titles, times, and schedules
2. Create goals with targets and deadlines
3. Mark tasks as complete
4. Provide motivation and productivity tips
5. Answer questions about habits and routines

When a user asks to create a task, respond with a JSON block like this:
\`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Task name", "icon": "emoji", "startTime": "HH:MM", "endTime": "HH:MM", "timeBlock": "Morning|Afternoon|Evening|Night", "days": ["MON","TUE","WED","THU","FRI","SAT","SUN"]}}
\`\`\`

When a user asks to create a goal, respond with a JSON block like this:
\`\`\`json
{"action": "CREATE_GOAL", "goal": {"title": "Goal name", "description": "Description", "targetDate": "YYYY-MM-DD", "category": "Fitness|Health|Career|Personal|Education"}}
\`\`\`

When a user asks to complete/check/mark a task as done, find the matching task from their list and respond with:
\`\`\`json
{"action": "COMPLETE_TASK", "taskId": "the-task-id", "taskTitle": "Task name"}
\`\`\`

When providing motivation, be encouraging, specific to their tasks, and concise.
Always be friendly, professional, and supportive.`;

export async function POST(request: NextRequest) {
    // Rate limiting: 20 requests per minute
    const rateLimitResponse = withRateLimit(request, {
        maxRequests: 20,
        windowMs: 60 * 1000,
        message: "Too many chat requests. Please wait a moment."
    });
    if (rateLimitResponse) {
        logger.warn("Rate limit exceeded for Groq chat", undefined, { action: "POST /api/ai/groq-chat" });
        return rateLimitResponse;
    }

    try {
        const body = await request.json();
        const message = sanitizePlainText(body.message);
        const context = body.context;
        const currentDate = body.currentDate; // Real-time date from browser

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
        }

        const groq = new Groq({ apiKey });

        // Build context message with task IDs for completion
        let contextMessage = SYSTEM_PROMPT;

        // Add current date to context
        if (currentDate) {
            contextMessage += `\n\nCURRENT DATE: Today is ${currentDate}. Use this as the reference for "today", "now", and any date-related queries.`;
        }
        if (context?.tasks?.length) {
            contextMessage += `\n\nUser's current tasks (with IDs for completion):\n${context.tasks.map((t: any) => `- [ID: ${t.id}] ${t.title} (${t.startTime}-${t.endTime})${t.isCompleted ? " ✅ DONE" : ""}`).join("\n")}`;
        }
        if (context?.goals?.length) {
            contextMessage += `\n\nUser's current goals:\n${context.goals.map((g: any) => `- ${g.title}`).join("\n")}`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: contextMessage },
                { role: "user", content: message }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_completion_tokens: 1024,
            top_p: 1,
        });

        const text = chatCompletion.choices[0]?.message?.content || "";

        // Parse for actions
        let action = null;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                action = JSON.parse(jsonMatch[1]);
            } catch (e) {
                // JSON parsing failed, no action
            }
        }

        return NextResponse.json({
            message: text,
            action,
        });
    } catch (error: any) {
        logger.apiError("/api/ai/groq-chat", "POST", error, 500);
        return NextResponse.json(
            { error: error.message || "Failed to generate response" },
            { status: 500 }
        );
    }
}
