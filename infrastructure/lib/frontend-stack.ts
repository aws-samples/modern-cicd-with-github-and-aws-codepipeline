import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

/**
 * Frontend Stack
 * 
 * Creates the frontend hosting infrastructure:
 * - S3 bucket for static website hosting (private)
 * - CloudFront distribution with Origin Access Identity (OAI)
 * - Deployment of React build artifacts
 * 
 * This stack is an alternative to using the base-infra stack's frontend resources.
 * It provides a standalone frontend deployment option.
 * 
 * Workshop Module: Lab 2 - Frontend Pipeline
 */
export class FrontendStack extends cdk.Stack {
  public readonly frontendBucket: s3.Bucket;
  public readonly cloudFrontDistribution: cloudfront.CloudFrontWebDistribution;
  public readonly cloudFrontOAI: cloudfront.OriginAccessIdentity;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================================================
    // S3 Bucket for Frontend Hosting (Private)
    // ========================================================================

    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `hotel-frontend-standalone-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // ========================================================================
    // CloudFront Origin Access Identity
    // ========================================================================

    this.cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI', {
      comment: `OAI for hotel-frontend-standalone-${this.account}`,
    });

    // Grant CloudFront OAI read access to frontend bucket
    this.frontendBucket.grantRead(this.cloudFrontOAI);

    // ========================================================================
    // CloudFront Distribution
    // ========================================================================

    this.cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, 'CloudFrontDistribution', {
      comment: 'CloudFront distribution for hotel app frontend (standalone)',
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.frontendBucket,
            originAccessIdentity: this.cloudFrontOAI,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
              viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              minTtl: cdk.Duration.seconds(0),
              defaultTtl: cdk.Duration.days(1),
              maxTtl: cdk.Duration.days(365),
              forwardedValues: {
                queryString: false,
                cookies: { forward: 'none' },
              },
            },
          ],
        },
      ],
      defaultRootObject: 'index.html',
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 300,
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 300,
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2,
    });

    // ========================================================================
    // Stack Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'Name of the S3 bucket for frontend hosting',
      exportName: `${this.stackName}-FrontendBucket`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.cloudFrontDistribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `${this.stackName}-CloudFrontDistributionId`,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${this.cloudFrontDistribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
      exportName: `${this.stackName}-CloudFrontURL`,
    });

    new cdk.CfnOutput(this, 'CloudFrontOAIId', {
      value: this.cloudFrontOAI.originAccessIdentityId,
      description: 'CloudFront Origin Access Identity ID',
      exportName: `${this.stackName}-CloudFrontOAIId`,
    });
  }
}
