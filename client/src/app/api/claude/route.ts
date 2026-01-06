import { NextResponse } from 'next/server';
import { generateClaudeResponse } from '../../../../services/claude';
import { getUserContext } from '../../../../services/userData';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    let systemContext = "";

    if (session?.user?.id) {
      systemContext = await getUserContext(session.user.id);
    }

    const { message, conversationHistory } = await request.json();
    const response = await generateClaudeResponse(message, conversationHistory, systemContext);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}