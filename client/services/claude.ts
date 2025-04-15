import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ConversationMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export async function generateClaudeResponse(userMessage: string, conversationHistory: ConversationMessage[] = []) {
  try {
    // Format the conversation history for Claude
    const messages = conversationHistory.map(msg => ({
      role: msg.sender as 'user' | 'assistant',
      content: msg.text
    }));

    // Add the current user message
    messages.push({ role: 'user', content: userMessage });

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", 
      max_tokens: 1000,
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