import type { AWS } from '@serverless/typescript';
const CognitoResources: AWS['resources']['Resources'] = {
  CognitoUserPool: {
    Type: 'AWS::Cognito::UserPool',
    Properties: {
      UserPoolName: '${sls:stage}-${self:service}-user-pool',
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: false,
          RequireNumbers: false,
          RequireUppercase: false,
          RequireSymbols: false,
        },
      },
    },
  },

  CognitoUserPoolClient: {
    Type: 'AWS::Cognito::UserPoolClient',
    Properties: {
      UserPoolId: { Ref: 'CognitoUserPool' },
      CallbackURLs: ['http://localhost:3000'],
      SupportedIdentityProviders: ['COGNITO'],
    },
  },

  /**
   *  If you're wanting to use custom IAM roles for your users then uncomment the next section
   * */
  /*
  WebUserPoolClient: {
    Type: 'AWS::Cognito::UserPoolClient',
    Properties: {
      UserPoolId: { Ref: 'CognitoUserPool' },
      ClientName: 'web',
      ExplicitAuthFlows: [
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
      ],
      PreventUserExistenceErrors: 'ENABLED',
    },
  },

  IdentityPool: {
    Type: 'AWS::Cognito::IdentityPool',
    Properties: {
      AllowUnauthenticatedIdentities: false,
      CognitoIdentityProviders: [
        {
          ClientId: { Ref: 'WebUserPoolClient' },
          ProviderName: { 'Fn::GetAtt': ['CognitoUserPool', 'ProviderName'] },
        },
      ],
    },
  },
  IdentityPoolRoleAttachment: {
    Type: 'AWS::Cognito::IdentityPoolRoleAttachment',
    Properties: {
      IdentityPoolId: { Ref: 'IdentityPool' },
      Roles: {
        authenticated: {
          'Fn::GetAtt': ['AuthenticatedRole', 'Arn'],
        },
      },
    },
  },
  AuthenticatedRole: {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: ['sts:AssumeRoleWithWebIdentity'],
          },
        ],
      },
      Policies: [
        {
          PolicyName: 'CognitoAuthorizedPolicy',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: { 'Fn::GetAtt': ['AssetS3Bucket', 'Arn'] },
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:GetObject'],
                Resource: {
                  'Fn::Join': ['', [{ 'Fn::GetAtt': ['AssetS3Bucket', 'Arn'] }, '/*']],
                },
              },
            ],
          },
        },
      ],
    },
  },
  */
};
export default CognitoResources;
