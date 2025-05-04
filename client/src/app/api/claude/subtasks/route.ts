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
Analyze the complex task below and break it down into a concise list of approximately 5-8 actionable, high-level subtasks.

Instructions:
1.  Focus on the *major* steps or components required to complete the task. Avoid overly granular micro-tasks.
2.  Ensure each subtask description is specific, clear, and starts with an action verb (e.g., Research, Design, Implement, Write, Review, Schedule, Finalize).
3.  Assign a priority level to each subtask: 3 (High), 2 (Medium), 1 (Low), 0 (None - for optional or non-critical items if applicable).
4.  Format the output *strictly* as a valid JSON array of objects.
5.  Each object in the array must have exactly two keys: "name" (string: the subtask description) and "priority" (integer: 0, 1, 2, or 3).

Output Constraints:
* The response MUST contain ONLY the raw JSON array.
* Do NOT include any introductory sentences, concluding remarks, explanations, apologies, or markdown code fences (like \`\`\`json).

Complex Task: "${task}"

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
