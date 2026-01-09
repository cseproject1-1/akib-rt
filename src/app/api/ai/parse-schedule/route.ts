import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// Initialize the Gemini AI client
const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

// System prompt for parsing schedule images
// System prompt for parsing schedule images
const SYSTEM_PROMPT = `You are a schedule parsing AI. Analyze the image of a class schedule/routine and extract all classes/tasks.

For each class/event you find, extract:
- title: The name of the class/subject
- startTime: Start time in HH:MM format (24-hour)
- endTime: End time in HH:MM format (24-hour)
- days: Array of days like ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
- icon: Return ONLY ONE of these specific emojis: 📚, 🧮, 🔬, 💻, �, 🎨, 🏃, 🌍, ⚛️, 🧬, �, 📝, �️, 🎵. Do NOT use any other characters or symbols. Defaults to 📚 if unsure.
- timeBlock: One of "Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night" based on the time

IMPORTANT: just give me raw data of schedule no extra word no introduced no chatty words you just write the schedule as a json so i can create A ROUTINE EXPORT.
Example response:
[{"title":"Mathematics","startTime":"09:00","endTime":"10:00","days":["MON","WED","FRI"],"icon":"🧮","timeBlock":"Morning"}]`;

export async function POST(request: NextRequest) {
    // Rate limiting: 10 requests per minute (image processing is expensive)
    const rateLimitResponse = withRateLimit(request, {
        maxRequests: 10,
        windowMs: 60 * 1000,
        message: "Too many schedule parsing requests. Please wait a moment."
    });
    if (rateLimitResponse) {
        logger.warn("Rate limit exceeded for schedule parsing", undefined, { action: "POST /api/ai/parse-schedule" });
        return rateLimitResponse;
    }

    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = file.type || "image/jpeg";

        const platform = formData.get("platform") as string || "gemini";
        let text = "[]";

        if (platform === "groq") {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) {
                return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
            }

            const groq = new Groq({ apiKey });

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: SYSTEM_PROMPT },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64}`,
                                },
                            },
                        ],
                    },
                ],
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                temperature: 0.1,
                max_completion_tokens: 4096,
                top_p: 1,
                response_format: { type: "json_object" },
            });

            text = completion.choices[0]?.message?.content || "[]";

        } else {
            // Default to Gemini
            const ai = getAIClient();

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: SYSTEM_PROMPT },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64,
                                },
                            },
                        ],
                    },
                ],
            });

            text = response.text || "[]";
        }

        // Try to parse the JSON response
        let tasks = [];
        try {
            // Robust JSON extraction for chatty models
            const jsonStartIndex = text.indexOf("[");
            const jsonEndIndex = text.lastIndexOf("]");

            if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
                tasks = JSON.parse(jsonString);
            } else {
                // Fallback to cleaning markdown if no array found (though unlikely for schedule)
                const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                tasks = JSON.parse(cleanedText);
            }
        } catch (parseError) {
            console.error("Failed to parse AI response:", text);
            return NextResponse.json(
                { error: "Failed to parse schedule from image. Please try a clearer image." },
                { status: 400 }
            );
        }

        // Validate and clean up tasks
        // Validate and clean up tasks
        // Safe emoji list to validate against
        const safeEmojis = ["📚", "🧮", "🔬", "💻", "📖", "🎨", "🏃", "🌍", "⚛️", "🧬", "📐", "📝", "🗣️", "🎵", "🛠️", "💼"];

        const validatedTasks = tasks.map((task: any) => {
            // Ensure icon is a valid emoji from our list, or fallback
            let icon = task.icon || "📚";
            if (!safeEmojis.includes(icon)) {
                // If not in safe list, check if it's at least a valid emoji (basic check) or fallback
                // For safety against garbage chars like \u00a9\u03a9, we just default to book if not in our curated list
                // But let's be slightly lenient if it looks like a single emoji char, otherwise fallback
                if (!/\p{Emoji}/u.test(icon) || icon.length > 4) {
                    icon = "📚";
                }
            }

            return {
                title: task.title || "Untitled Class",
                startTime: task.startTime || "09:00",
                endTime: task.endTime || "10:00",
                days: task.days || ["MON", "TUE", "WED", "THU", "FRI"],
                icon: icon,
                timeBlock: task.timeBlock || "Morning",
            };
        });

        return NextResponse.json({
            success: true,
            tasks: validatedTasks,
            count: validatedTasks.length,
        });
    } catch (error: any) {
        logger.apiError("/api/ai/parse-schedule", "POST", error, 500);
        return NextResponse.json(
            { error: error.message || "Failed to parse schedule image" },
            { status: 500 }
        );
    }
}
