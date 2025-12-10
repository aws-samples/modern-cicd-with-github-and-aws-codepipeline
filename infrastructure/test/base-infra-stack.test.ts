import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';

describe('BaseInfraStack', () => {
  let app: cdk.App;
  let stack: BaseInfraStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new BaseInfraStack(app, 'TestBaseInfraStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Buckets', () => {
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

    test('creates pipeline artifacts bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldArtifacts',
              Status: 'Enabled',
              ExpirationInDays: 30,
            },
          ],
        },
      });
    });

    test('creates exactly two S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('CloudFront', () => {
    test('creates CloudFront Origin Access Identity', () => {
      template.hasResourceProperties('AWS::CloudFront::CloudFrontOriginAccessIdentity', {
        CloudFrontOriginAccessIdentityConfig: {
          Comment: Match.stringLikeRegexp('OAI for hotel-frontend-.*'),
        },
      });
    });

    test('creates CloudFront distribution with correct configuration', () => {
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

  describe('IAM Roles', () => {
    test('creates CodeBuild backend role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'CodeBuildBackEndRole',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates CodeBuild frontend role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'CodeBuildFrontEndRole',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates CodeBuild integration test role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'CodeBuildIntTestRole',
      });
    });

    test('creates CodePipeline role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'CodePipelineRole',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates exactly four IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 4);
    });
  });

  describe('SSM Parameters', () => {
    test('creates SSM parameters for role ARNs', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/hotelapp/roles/CodeBuildBackEndRoleArn',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/hotelapp/roles/CodeBuildFrontEndRoleArn',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/hotelapp/roles/CodePipelineRoleArn',
        Type: 'String',
      });
    });

    test('creates SSM parameters for S3 buckets', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/hotelapp/s3/FrontendBucketName',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/hotelapp/s3/PipelineArtifactsBucketName',
        Type: 'String',
      });
    });

    test('creates SSM parameters for CloudFront', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/hotelapp/cloudfront/DistributionId',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/hotelapp/cloudfront/DistributionDomain',
        Type: 'String',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports frontend bucket name', () => {
      template.hasOutput('FrontendBucketName', {
        Export: {
          Name: 'TestBaseInfraStack-FrontendBucket',
        },
      });
    });

    test('exports CloudFront distribution ID', () => {
      template.hasOutput('CloudFrontDistributionId', {
        Export: {
          Name: 'TestBaseInfraStack-CloudFrontDistributionId',
        },
      });
    });

    test('exports CloudFront URL', () => {
      template.hasOutput('CloudFrontURL', {
        Export: {
          Name: 'TestBaseInfraStack-CloudFrontURL',
        },
      });
    });

    test('exports role ARNs', () => {
      template.hasOutput('CodeBuildBackEndRoleArn', {});
      template.hasOutput('CodeBuildFrontEndRoleArn', {});
      template.hasOutput('CodePipelineRoleArn', {});
    });
  });
});
