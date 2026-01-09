import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rateLimit";
import { sanitizePlainText } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

// Initialize the Gemini AI client
const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

// Enhanced system prompt with all capabilities
const SYSTEM_PROMPT = `You are "Routine AI", a smart, friendly productivity assistant for a routine tracking app. You have these capabilities:

## CORE ACTIONS (respond with JSON blocks):

### 1. CREATE TASK
\`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Task name", "icon": "emoji", "startTime": "HH:MM", "endTime": "HH:MM", "timeBlock": "Dawn|Morning|Noon|Afternoon|Evening|Night", "days": ["MON","TUE","WED","THU","FRI","SAT","SUN"]}}
\`\`\`

### 2. CREATE GOAL  
\`\`\`json
{"action": "CREATE_GOAL", "goal": {"title": "Goal name", "description": "Description", "targetDate": "YYYY-MM-DD", "category": "Fitness|Health|Career|Personal|Education"}}
\`\`\`

### 3. COMPLETE TASK
\`\`\`json
{"action": "COMPLETE_TASK", "taskId": "the-task-id", "taskTitle": "Task name"}
\`\`\`

### 4. DELETE TASK
\`\`\`json
{"action": "DELETE_TASK", "taskId": "the-task-id", "taskTitle": "Task name"}
\`\`\`

### 5. EDIT TASK (change time, title, or days)
\`\`\`json
{"action": "EDIT_TASK", "taskId": "the-task-id", "updates": {"title": "New title", "startTime": "HH:MM", "endTime": "HH:MM", "days": ["MON","WED","FRI"]}}
\`\`\`

## SMART FEATURES:

1. **Conflict Detection**: If user adds a task that overlaps with existing tasks, warn them!
2. **Smart Suggestions**: Proactively suggest tasks based on their goals and patterns
3. **Streak Encouragement**: Celebrate streaks and milestones (1 week, 1 month, etc.)
4. **Natural Scheduling**: Understand "every weekday", "twice a week", "mornings", etc.
5. **Multi-language**: Respond in the same language the user writes in

## PERSONALITY:
- Be warm, encouraging, and concise
- Use emojis sparingly but effectively 🎯
- Celebrate wins and be supportive during setbacks
- Give specific, actionable advice
- Remember context from the current conversation

## IMPORTANT:
- Only include ONE JSON block per response if an action is needed
- Always confirm what you did after an action
- If unsure which task the user means, ask for clarification
- For time conflicts, show both tasks and ask how to proceed`;

export async function POST(request: NextRequest) {
    // Rate limiting: 20 requests per minute for AI chat
    const rateLimitResponse = withRateLimit(request, {
        maxRequests: 20,
        windowMs: 60 * 1000,
        message: "Too many chat requests. Please wait a moment."
    });
    if (rateLimitResponse) {
        logger.warn("Rate limit exceeded for AI chat", undefined, { action: "POST /api/ai/chat" });
        return rateLimitResponse;
    }

    try {
        const body = await request.json();

        // Sanitize user input
        const message = sanitizePlainText(body.message);
        const context = body.context;
        const conversationHistory = body.conversationHistory;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const ai = getAIClient();

        // Build context with task IDs, completion status, and streaks
        let contextMessage = SYSTEM_PROMPT;

        if (context?.tasks?.length) {
            const taskList = context.tasks.map((t: any) => {
                const status = t.isCompleted ? "✅" : "⬜";
                return `- ${status} [ID: ${t.id}] "${sanitizePlainText(t.title)}" (${t.startTime}-${t.endTime}, ${t.days?.join(",") || "daily"})${t.streak ? ` 🔥${t.streak}` : ""}`;
            }).join("\n");
            contextMessage += `\n\n## USER'S TASKS:\n${taskList}`;
        }

        if (context?.goals?.length) {
            const goalList = context.goals.map((g: any) => `- "${sanitizePlainText(g.title)}" (${g.category || "Personal"})`).join("\n");
            contextMessage += `\n\n## USER'S GOALS:\n${goalList}`;
        }

        // Build conversation with history for context memory
        const contents: any[] = [
            { role: "user", parts: [{ text: contextMessage }] },
            { role: "model", parts: [{ text: "I understand! I'm Routine AI with full task management capabilities. I can create, edit, delete, and complete tasks, set goals, detect conflicts, and keep you motivated. How can I help you today?" }] },
        ];

        // Add conversation history for context memory (last 10 messages)
        if (conversationHistory?.length) {
            const recentHistory = conversationHistory.slice(-10);
            for (const msg of recentHistory) {
                contents.push({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: sanitizePlainText(msg.content) }],
                });
            }
        }

        // Add current message
        contents.push({ role: "user", parts: [{ text: message }] });

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents,
        });

        const text = response.text || "";

        // Parse for actions (support multiple JSON blocks for complex operations)
        let action = null;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                action = JSON.parse(jsonMatch[1]);
            } catch (e) {
                // JSON parsing failed, no action
            }
        }

        logger.info("AI chat response generated", { action: "POST /api/ai/chat" });

        return NextResponse.json({
            message: text,
            action,
        });
    } catch (error: any) {
        logger.apiError("/api/ai/chat", "POST", error, 500);
        return NextResponse.json(
            { error: error.message || "Failed to generate response" },
            { status: 500 }
        );
    }
}

