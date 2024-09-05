'use server';

import { bedrock, db } from '@/config';
import { conversationSchema } from '@/schema';
import { IPromptStatus } from '@/types';
import {
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { currentUser } from '@clerk/nextjs';
import { randomUUID } from 'crypto';

export const createConversation = async (prompt: string) => {
  const currentUserData = await currentUser();

  if (!currentUserData) {
    throw new Error('User not found');
  }

  let generation = '';
  let sessionId = '';

  let input: RetrieveAndGenerateCommandInput = {
    input: {
      text: prompt,
    },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: 'CKZEFVLXNO',
        modelArn:
          'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0',
      },
    },
  };

  try {
    // Invoke the Bedrock AI model with the prepared input
    const bedrockResponse = await bedrock.send(
      new RetrieveAndGenerateCommand(input)
    );

    // Parse the response from Bedrock to get the generated text
    // const response = JSON.parse(new TextDecoder().decode(bedrockResponse.output));

    // generation = response.content[0].text;
    generation = bedrockResponse.output?.text || '';
    sessionId = bedrockResponse.sessionId || '';
    console.log(generation);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to generate response from Bedrock');
  }

  // Generate a randomUUID for the new conversation this will be used for the page UUID
  // const uuid = randomUUID();
  const conversationUuid = `CONVERSATION#${sessionId}`;

  // Build the input for creating the new item in the DB
  const createBody = {
    pk: `USER#${currentUserData?.id}`,
    sk: conversationUuid,
    uuid: sessionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: `${prompt.slice(0, 20)}...`,
    conversation: [
      {
        author: `USER#${currentUserData?.id}`,
        content: prompt,
      },
      {
        author: 'assistant',
        content: generation,
      },
    ],
    status: IPromptStatus.ACTIVE,
  };

  try {
    // Create the item in the DB using the prepared body
    await db.send(
      new PutCommand({
        TableName: process.env.DB_TABLE_NAME,
        Item: createBody,
        ReturnValues: 'ALL_OLD',
      })
    );

    // Return the created data to the frontend
    return conversationSchema.parse(createBody);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to create conversation');
  }
};
