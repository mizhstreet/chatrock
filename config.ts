import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const awsConfig: DynamoDBClientConfig = {
  region: process.env.AWS_API_REGION || '',
};

export const db = DynamoDBDocument.from(new DynamoDB(awsConfig), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
});

// export const bedrock = new BedrockRuntimeClient({
//   ...awsConfig,
//   region: 'us-east-1',
// });

export const bedrock = new BedrockAgentRuntimeClient({
  ...awsConfig,
  region: 'us-east-1',
});
