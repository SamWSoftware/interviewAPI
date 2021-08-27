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
        handler: 'src/endpoints/getFlights/index.handler',
        events: [
            {
                http: {
                    method: 'get',
                    path: '${self:custom.APIVersion}/flights',
                    cors: corsSettings,
                    authorizer,
                },
            },
        ],
    },
    bookFlight: {
        handler: 'src/endpoints/bookFlight/index.handler',
        events: [
            {
                http: {
                    method: 'post',
                    path: '${self:custom.APIVersion}/flights/{flightID}',
                    cors: corsSettings,
                    authorizer,
                },
            },
        ],
    },
};

export default functions;
