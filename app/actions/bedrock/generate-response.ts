'use server';

import { bedrock, db } from '@/config';
import { getOneConversation } from '../db/get-one-conversation';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockResponseSchema, conversationSchema } from '@/schema';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { currentUser } from '@clerk/nextjs';

export const generateResponse = async (uuid: string) => {
  const currentUserData = await currentUser();
  const { conversation } = await getOneConversation(uuid);

  // Build the prompt for the AI using the correct syntax
  const prompt = conversation.map(({ author, content }) => {
    return {
      role: author === 'assistant' ? 'assistant' : 'user',
      content: [{ type: 'text', text: content }],
    };
  });

  // Prepare the input for the AI model
  const input = {
    accept: 'application/json',
    contentType: 'application/json',
    modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: prompt,
      max_tokens: 1000,
    }),
  };

  let generation = '';

  try {
    // Invoke the Bedrock AI model with the prepared input
    const bedrockResponse = await bedrock.send(new InvokeModelCommand(input));

    // Parse the response from Bedrock to get the generated text
    const response = JSON.parse(new TextDecoder().decode(bedrockResponse.body));

    generation = response.content[0].text;
    console.log(generation);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to generate response from Bedrock');
  }

  try {
    // Update the conversation in the database adding the updated response to the end of the conversation
    const { Attributes } = await db.send(
      new UpdateCommand({
        TableName: process.env.DB_TABLE_NAME,
        Key: {
          pk: `USER#${currentUserData?.id}`,
          sk: `CONVERSATION#${uuid}`,
        },
        UpdateExpression: 'set conversation = :c',
        ExpressionAttributeValues: {
          ':c': [
            ...conversation,
            {
              author: 'assistant',
              content: generation,
            },
          ],
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    // Return the updated conversation to the frontend
    return conversationSchema.parse(Attributes);
  } catch (error) {
    console.log(error);
    throw new Error('Failed to update conversation');
  }
};
