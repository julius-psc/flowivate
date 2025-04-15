import { NextApiRequest, NextApiResponse } from 'next';
import { generateClaudeResponse } from '../../../../services/claude';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory } = req.body;
    const response = await generateClaudeResponse(message, conversationHistory);
    res.status(200).json({ response });
  } catch (error) {
    console.error('API route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}