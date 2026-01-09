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

export async function POST(request: NextRequest) {
    // Rate limiting: 30 requests per minute for motivation
    const rateLimitResponse = withRateLimit(request, {
        maxRequests: 30,
        windowMs: 60 * 1000,
    });
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        const body = await request.json();
        const tasks = body.tasks;
        const userName = sanitizePlainText(body.userName);

        const ai = getAIClient();

        // Build a prompt for motivation
        let tasksContext = "The user has no tasks today.";
        if (tasks?.length) {
            tasksContext = `The user has the following tasks today:\n${tasks.map((t: any) => `- ${sanitizePlainText(t.title)} at ${t.startTime}`).join("\n")}`;
        }

        const prompt = `You are a motivational coach for a routine tracking app. Generate a short, personalized, encouraging message (2-3 sentences max) to motivate the user to complete their tasks today.

${tasksContext}

User's name: ${userName || "there"}

Be warm, specific to their tasks if possible, and inspiring. Use an emoji at the start.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const motivation = response.text || "🌟 You've got this! Every task you complete today brings you closer to your goals. Let's make it a great day!";

        return NextResponse.json({ motivation });
    } catch (error: any) {
        logger.apiError("/api/ai/motivation", "POST", error, 500);
        // Return a fallback motivation on error
        return NextResponse.json({
            motivation: "🚀 Rise and shine! Today is a new opportunity to crush your goals. You've got this!",
        });
    }
}
