import { NextRequest, NextResponse } from "next/server";
import { generateClaudeResponse } from "../../../../../services/claude";

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Define the expected structure of the request body for this specific route
interface RequestBody {
  taskDescription: string;
}

// Define the structure for the breakdown prompt specifically
const breakdownPromptTemplate = (task: string): string => `
Break down the following complex task into smaller, actionable subtasks.
For each subtask, assign a priority level: 3 for High, 2 for Medium, 1 for Low, and 0 for None.
Return the result ONLY as a valid JSON array of objects. Each object in the array should have the following structure:
{ "name": "Subtask description", "priority": <0|1|2|3> }

Do NOT include any introductory text, explanations, or code block formatting (like \`\`\`json). Just the raw JSON array.

Task to break down: "${task}"

JSON Array:
`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { taskDescription } = body;

    if (
      !taskDescription ||
      typeof taskDescription !== "string" ||
      taskDescription.trim() === ""
    ) {
      return NextResponse.json(
        { message: "Valid taskDescription is required" },
        { status: 400 }
      );
    }

    const finalPrompt = breakdownPromptTemplate(taskDescription.trim());

    // Call the Claude service with the specific prompt
    // No conversation history needed for this specific task
    const aiResponseText = await generateClaudeResponse(finalPrompt);

    // Return the raw text response from Claude.
    // The client-side will be responsible for parsing the JSON.
    return NextResponse.json({ response: aiResponseText });
  } catch (error: unknown) {
    console.error("API route /api/claude/subtasks error:", error);
    // Don't expose detailed error messages to the client in production
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      {
        message: `Internal server error processing AI request: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
