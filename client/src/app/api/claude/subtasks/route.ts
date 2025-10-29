import { NextRequest, NextResponse } from "next/server";
import { generateClaudeResponse } from "../../../../../services/claude";
import { auth } from "@/lib/auth";

interface RequestBody {
  taskDescription: string;
}

const MAX_TASK_DESCRIPTION_LENGTH = 2000;

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
  const session = await auth();
  if (!session?.user?.id) {
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
        { message: "Task description is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const trimmedTaskDescription = taskDescription.trim();

    if (trimmedTaskDescription.length > MAX_TASK_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { message: `Task description exceeds maximum length of ${MAX_TASK_DESCRIPTION_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const finalPrompt = breakdownPromptTemplate(trimmedTaskDescription);
    const aiResponseText = await generateClaudeResponse(finalPrompt);

    try {
      const parsedJsonResponse = JSON.parse(aiResponseText);
      return NextResponse.json({ response: JSON.stringify(parsedJsonResponse) });
    } catch (parseError) {
      console.error("API route /api/claude/subtasks - AI response JSON parsing error:", {
        aiResponse: aiResponseText,
        parseErrorDetails: parseError instanceof Error ? { name: parseError.name, message: parseError.message } : parseError,
      });
      return NextResponse.json(
        { message: "AI service returned an invalid response format." },
        { status: 502 }
      );
    }

  } catch (error: unknown) {
    let errorContext: Record<string, unknown> = {};
    if (error instanceof Error) {
        errorContext = { name: error.name, message: error.message, cause: error.cause };
    } else if (typeof error === 'object' && error !== null) {
        errorContext = { errorDetails: error };
    } else {
        errorContext = { errorInfo: String(error) };
    }
    console.error("API route /api/claude/subtasks - General error:", errorContext);

    return NextResponse.json(
      { message: "An internal server error occurred while processing your request." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}