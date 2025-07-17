
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/summarize
 *
 * Expects a JSON body shaped like:
 * {
 *   "messages": [{ "role": "user", "content": "How do I get started?" }],
 *   "userMessage": "How do I get started?"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      // userMessage,
      model = "inkeep-base-turbo",
      ...rest
    } = await req.json();

    const response = await fetch("https://api.inkeep.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INKEEP_API_KEY!}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `The below is a conversation between a Datadog customer and an AI support assistant. The user has interacted with the assistant but has indicated they'd like to talk directly to the Datadog support team.
  
  Given the transcript of the AI chat conversation below, generate a handoff summary. This summary will be shown as the first message in the conversation. The summary should focus on all the key details about the user's scenario/question, and which parts of it remain unaddressed. The end-user and support agent will both see this summary, so make the tone appropriate for both. As needed, use adverbs/pronouns from the perspective of the end-user. Keep things objective, direct, and to the point, the goal is to pass on the necessary context for the support team so they don't need to reference the full AI chat conversation, while keeping it light/to the point.
  
  ==serialized AI chat==
  ${messages.map((message: { role: string; content: string }) => `${message.role}: ${message.content}`).join("\n")}
  ===
  `,
          },

          {
            role: "user",
            content: "Summarize the AI chat to create a handoff message.",
          },
        ],
        ...rest,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: errText || "Error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data); // 200 OK
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
