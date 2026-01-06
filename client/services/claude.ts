import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ConversationMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export async function generateClaudeResponse(userMessage: string, conversationHistory: ConversationMessage[] = [], systemContext: string = "") {
  try {
    // Format the conversation history for Claude
    const messages = conversationHistory.map(msg => ({
      role: msg.sender as 'user' | 'assistant',
      content: msg.text
    }));

    // Add the current user message
    messages.push({ role: 'user', content: userMessage });

    const baseSystemPrompt = "You are a helpful and engaging AI assistant for a productivity dashboard. Your goal is to be motivating, clear, and fun to read. \n\nFORMATTING GUIDELINES:\n1. STRUCTURE: Use Markdown headers (# H1, ## H2, ### H3) to organize your response into distinct sections.\n2. VISUALS: Use specific, relevant emojis 🌟 throughout your response to make it visually appealing and friendly.\n3. SPACING: Use horizontal dividers (---) to separate different topics or sections. Always ensure there is a double newline before and after headers and dividers.\n4. LISTS: Use bullet points for steps or lists. Keep them concise.\n5. EMPHASIS: Use **bold** for key terms, but do NOT bold entire sentences.\n6. TONE: Be encouraging, concise, and actionable. Avoid wall-of-text paragraphs.\n\nExample structure:\n# Main Topic 🚀\nShort intro...\n\n---\n## Key Action ⚡\n* Point 1\n* Point 2\n\n### Pro Tip 💡\nShort tip...";

    const finalSystemPrompt = systemContext ? `${baseSystemPrompt}\n\n${systemContext}` : baseSystemPrompt;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      system: finalSystemPrompt,
      messages: messages,
    });

    // Extract text from the content (handling different types of content blocks)
    if (response.content && response.content.length > 0) {
      const firstContentBlock = response.content[0];
      if ('text' in firstContentBlock) {
        return firstContentBlock.text;
      }
    }

    return "No response content available.";
  } catch (error) {
    console.error('Error generating Claude response:', error);
    return "I'm having trouble processing your request right now. Please try again.";
  }
}