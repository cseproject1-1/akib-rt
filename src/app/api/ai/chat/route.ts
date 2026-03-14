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

### 1. CREATE TASK (Recurring or Date-Specific)

**For RECURRING tasks** (e.g., "every Monday", "twice a week"):
\`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Task name", "icon": "emoji", "startTime": "HH:MM", "endTime": "HH:MM", "timeBlock": "Dawn|Morning|Noon|Afternoon|Evening|Night", "days": ["MON","TUE","WED","THU","FRI","SAT","SUN"]}}
\`\`\`

**For DATE-SPECIFIC tasks** (e.g., "on January 15th", "next Monday", "tomorrow"):
\`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Task name", "icon": "emoji", "startTime": "HH:MM", "endTime": "HH:MM", "timeBlock": "Dawn|Morning|Noon|Afternoon|Evening|Night", "specificDate": "YYYY-MM-DD", "days": []}}
\`\`\`

### 2. CREATE GOAL  
\`\`\`json
{"action": "CREATE_GOAL", "goal": {"title": "Goal name", "description": "Description", "targetDate": "YYYY-MM-DD", "category": "Fitness|Health|Career|Personal|Education"}}
\`\`\`

### 3. COMPLETE TASK
\`\`\`json
{"action": "COMPLETE_TASK", "taskId": "the-task-id", "taskTitle": "Task name"}
\`\`\`

### 4. DELETE TASK (by ID or by date)
\`\`\`json
{"action": "DELETE_TASK", "taskId": "the-task-id", "taskTitle": "Task name"}
\`\`\`

### 5. EDIT TASK (change time, title, days, or date)

**To change to a specific date** (e.g., "move to January 20th"):
\`\`\`json
{"action": "EDIT_TASK", "taskId": "the-task-id", "updates": {"specificDate": "YYYY-MM-DD", "days": []}}
\`\`\`

**To change time or other properties**:
\`\`\`json
{"action": "EDIT_TASK", "taskId": "the-task-id", "updates": {"title": "New title", "startTime": "HH:MM", "endTime": "HH:MM"}}
\`\`\`

**To convert from date-specific to recurring**:
\`\`\`json
{"action": "EDIT_TASK", "taskId": "the-task-id", "updates": {"days": ["MON","WED","FRI"], "specificDate": null}}
\`\`\`

## DATE PARSING INTELLIGENCE:

When users mention dates, intelligently parse them:
- **Absolute dates**: "January 15th 2026", "1/15/2026", "Jan 15" → "2026-01-15"
- **Relative dates**: "tomorrow", "next Monday", "this Friday" → calculate and use "YYYY-MM-DD"
- **Today's date is provided in context** - use it as reference for all date calculations
- **Time expressions**: "morning" → 09:00, "afternoon" → 14:00, "evening" → 18:00

**IMPORTANT DATE RULES**:
1. **Always use YYYY-MM-DD format** for specificDate in JSON
2. **When user says "Monday"** without qualifier:
   - If it's unclear, ask: "Do you mean next Monday (specific date) or every Monday (recurring)?"
   - If context suggests one-time event (e.g., "dentist", "appointment"), default to next Monday (date-specific)
   - If context suggests routine (e.g., "workout", "meditation"), ask for clarification
3. **Validate dates**: Don't create tasks in the past (warn user first)
4. **Date-specific tasks use empty days array**: \`"days": []\` when specificDate is set

## SMART FEATURES:

1. **Conflict Detection**: If user adds a task that overlaps with existing tasks, warn them!
2. **Smart Suggestions**: Proactively suggest tasks based on their goals and patterns
3. **Streak Encouragement**: Celebrate streaks and milestones (1 week, 1 month, etc.)
4. **Natural Scheduling**: Understand "every weekday", "twice a week", "mornings", etc.
5. **Calendar Intelligence**: Recognize one-time events vs recurring routines
6. **Multi-language**: Respond in the same language the user writes in

## EXAMPLES:

**User**: "Create a dentist appointment on January 15th at 2pm"
**You**: \`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Dentist Appointment", "icon": "🦷", "startTime": "14:00", "endTime": "15:00", "timeBlock": "Afternoon", "specificDate": "2026-01-15", "days": []}}
\`\`\`
*Response*: "Got it! I've scheduled your dentist appointment for January 15th, 2026 at 2:00 PM. 🦷"

**User**: "Add workout every Monday morning"
**You**: \`\`\`json
{"action": "CREATE_TASK", "task": {"title": "Workout", "icon": "💪", "startTime": "07:00", "endTime": "08:00", "timeBlock": "Morning", "days": ["MON"]}}
\`\`\`
*Response*: "Perfect! I've added a weekly workout routine for Monday mornings at 7:00 AM. 💪"

**User**: "Move my meeting to January 20th"
**You**: First find the task ID, then: \`\`\`json
{"action": "EDIT_TASK", "taskId": "task-id-here", "updates": {"specificDate": "2026-01-20", "days": []}}
\`\`\`
*Response*: "Done! I've rescheduled your meeting to January 20th, 2026. 📅"

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
- For time conflicts, show both tasks and ask how to proceed
- When creating date-specific tasks, ALWAYS include specificDate in YYYY-MM-DD format`;

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
        const currentDate = body.currentDate; // Real-time date from browser

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const ai = getAIClient();

        // Build context with task IDs, completion status, and streaks
        let contextMessage = SYSTEM_PROMPT;

        // Add current date to context
        if (currentDate) {
            contextMessage += `\n\n## CURRENT DATE:\nToday is ${currentDate}. Use this as the reference for "today", "now", and any date-related queries.`;
        }

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

