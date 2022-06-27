import { AWS } from '@serverless/typescript';

const corsSettings = {
  headers: [
    // Specify allowed headers
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
    'X-Amz-User-Agent',
  ],
  allowCredentials: false,
};

interface Authorizer {
  name: string;
  type: string;
  arn: {
    'Fn::GetAtt': string[];
  };
}
const authorizer: Authorizer = {
  name: 'authorizer',
  type: 'COGNITO_USER_POOLS',
  arn: { 'Fn::GetAtt': ['CognitoUserPool', 'Arn'] },
};

const functions: AWS['functions'] = {
  getFlights: {
    handler: 'src/functions/getFlights/index.handler',
    events: [
      {
        http: {
          method: 'get',
          path: 'flights',
          cors: corsSettings,
          authorizer,
        },
      },
    ],
  },
  bookFlight: {
    handler: 'src/functions/bookFlight/index.handler',
    events: [
      {
        http: {
          method: 'post',
          path: 'flights/{flightID}',
          cors: corsSettings,
          authorizer,
        },
      },
    ],
  },

  processProductCSV: {
    handler: 'src/functions/processProductCSV/index.handler',
    events: [
      {
        s3: {
          bucket: '${self:custom.assetBucketName}',
          event: 's3:ObjectCreated:*',
          rules: [{ prefix: 'products/' }, { suffix: '.csv' }],
          existing: true,
        },
      },
    ],
  },
};

export default functions;
