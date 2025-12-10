import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { FrontendStack } from '../lib/frontend-stack';

describe('FrontendStack', () => {
  let app: cdk.App;
  let stack: FrontendStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new FrontendStack(app, 'TestFrontendStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('creates frontend bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('CloudFront', () => {
    test('creates CloudFront Origin Access Identity', () => {
      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: Match.stringLikeRegexp('OAI for hotel-frontend-standalone-.*'),
        },
      });
    });

    test('creates CloudFront distribution with OAI', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
          DefaultRootObject: 'index.html',
          HttpVersion: 'http2',
          PriceClass: 'PriceClass_100',
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
          },
          CustomErrorResponses: Match.arrayWith([
            Match.objectLike({
              ErrorCode: 403,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
            }),
            Match.objectLike({
              ErrorCode: 404,
              ResponseCode: 200,
              ResponsePagePath: '/index.html',
            }),
          ]),
        },
      });
    });

    test('creates S3 bucket policy for CloudFront OAI', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 's3:GetObject',
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports frontend bucket name', () => {
      template.hasOutput('FrontendBucketName', {
        Export: {
          Name: 'TestFrontendStack-FrontendBucket',
        },
      });
    });

    test('exports CloudFront distribution ID', () => {
      template.hasOutput('CloudFrontDistributionId', {
        Export: {
          Name: 'TestFrontendStack-CloudFrontDistributionId',
        },
      });
    });

    test('exports CloudFront URL', () => {
      template.hasOutput('CloudFrontURL', {
        Export: {
          Name: 'TestFrontendStack-CloudFrontURL',
        },
      });
    });

    test('exports CloudFront OAI ID', () => {
      template.hasOutput('CloudFrontOAIId', {
        Export: {
          Name: 'TestFrontendStack-CloudFrontOAIId',
        },
      });
    });
  });
});
