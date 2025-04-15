import { NextResponse } from 'next/server';
import { generateClaudeResponse } from '../../../../services/claude';

export async function POST(request: Request) {
  try {
    const { message, conversationHistory } = await request.json();
    const response = await generateClaudeResponse(message, conversationHistory);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}