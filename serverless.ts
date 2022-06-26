import type { AWS } from '@serverless/typescript';

import functions from './serverless/functions';
import DynamoResources from './serverless/dynamodb';
import AssetsBucketAndCloudfront from './serverless/AssetsBucketAndCloudfront';
import CognitoResources from './serverless/cognitoResources';

const serverlessConfiguration: AWS = {
  service: 'slstemplate202205',
  frameworkVersion: '3',

  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dynamodb-local'],
  custom: {
    tables: {
      singleTable: '${self:provider.stage}-${self:service}-single-table',
    },
    profile: {
      dev: 'dev-profile',
      int: 'int-profile',
      prod: 'prod-profile',
    },
    clientOrigins: {
      dev: 'https://dev.flights.com',
      int: 'https://int.flights.com',
      prod: 'https://prod.flights.com',
    },
    assetBucketName: '${self:provider.stage}-${self:service}-s3-assets',

    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    dynamodb: {
      stages: ['dev'],
      start: {
        port: 8005,
        inMemory: true,
        migrate: true,
        seed: true,
      },
      seed: {
        dev: {
          sources: [
            {
              table: '${self:custom.tables.singleTable}',
              sources: ['serverless/seedData/flights.json'],
            },
          ],
        },
      },
    },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    profile: '${self:custom.profile.${self:provider.stage}}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      singleTable: '${self:custom.tables.singleTable}',
    },
    lambdaHashingVersion: '20201221',
  },
  functions,

  resources: {
    Resources: {
      ...DynamoResources,
      ...AssetsBucketAndCloudfront,
      ...CognitoResources,
    },
    Outputs: {
      DynamoTableName: {
        Value: '${self:custom.tables.singleTable}',
        Export: {
          Name: 'DynamoTableName',
        },
      },
      UserPoolId: {
        Value: { Ref: 'CognitoUserPool' },
        Export: {
          Name: 'UserPoolId',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
