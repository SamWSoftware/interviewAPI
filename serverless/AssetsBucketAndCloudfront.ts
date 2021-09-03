import type { AWS } from '@serverless/typescript';

const AssetsBucketAndCloudfront: AWS['resources']['Resources'] = {
    AssetS3Bucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
            BucketName: '${self:custom.assetBucketName}',
            AccessControl: 'BucketOwnerFullControl',
            CorsConfiguration: {
                CorsRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
                        AllowedOrigins: ['*'],
                        ExposedHeaders: [
                            'x-amz-server-side-encryption',
                            'x-amz-request-id',
                            'x-amz-id-2',
                            'ETag',
                        ],
                    },
                ],
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        },
    },
    AssetS3BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
            Bucket: { Ref: 'AssetS3Bucket' },
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: '*',

                        Action: 's3:GetObject',

                        Resource: {
                            'Fn::Join': ['/', [{ 'Fn::GetAtt': ['AssetS3Bucket', 'Arn'] }, '*']],
                        },
                    },
                ],
            },
        },
    },
    CloudFrontDistribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
            DistributionConfig: {
                Origins: [
                    {
                        DomainName: { 'Fn::GetAtt': ['AssetS3Bucket', 'DomainName'] },
                        Id: { 'Fn::GetAtt': ['AssetS3Bucket', 'DomainName'] },
                        CustomOriginConfig: {
                            HTTPPort: 80,
                            HTTPSPort: 443,
                            OriginProtocolPolicy: 'https-only',
                        },
                    },
                ],
                Enabled: 'true',
                Restrictions: {
                    GeoRestriction: {
                        Locations: ['DE', 'PL', 'UA', 'IT', 'AT'],
                        RestrictionType: 'whitelist',
                    },
                },

                HttpVersion: 'http2',
                DefaultCacheBehavior: {
                    TargetOriginId: { 'Fn::GetAtt': ['AssetS3Bucket', 'DomainName'] },
                    ViewerProtocolPolicy: 'redirect-to-https',
                    AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                    CachedMethods: ['GET', 'HEAD'],
                    ForwardedValues: {
                        QueryString: true,
                        Headers: ['Origin'],
                    },
                    Compress: false,
                },
            },
        },
    },
};

export default AssetsBucketAndCloudfront;
