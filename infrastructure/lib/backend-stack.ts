import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface BackendStackProps extends cdk.StackProps {
  hotelName?: string;
  environment?: string;
}

/**
 * Backend Stack
 * 
 * Creates the serverless backend infrastructure:
 * - DynamoDB table for storing room data
 * - Lambda function for API handling
 * - API Gateway REST API
 * - IAM roles and policies
 * - CloudWatch log groups
 * 
 * This stack corresponds to the backend.yml CloudFormation template
 * and provides the same resources in CDK format.
 * 
 * Workshop Module: Lab 3 - Backend Pipeline
 */
export class BackendStack extends cdk.Stack {
  public readonly roomsTable: dynamodb.Table;
  public readonly apiFunction: lambda.Function;
  public readonly api: apigateway.RestApi;
  public readonly lambdaExecutionRole: iam.Role;

  constructor(scope: Construct, id: string, props?: BackendStackProps) {
    super(scope, id, props);

    const hotelName = props?.hotelName || 'Hotel Yorba';
    const environment = props?.environment || 'dev';

    // ========================================================================
    // DynamoDB Table
    // ========================================================================

    this.roomsTable = new dynamodb.Table(this, 'RoomsTable', {
      tableName: `Rooms-${environment}-${this.stackName}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    cdk.Tags.of(this.roomsTable).add('Environment', environment);
    cdk.Tags.of(this.roomsTable).add('Application', 'HotelManagement');
    cdk.Tags.of(this.roomsTable).add('ManagedBy', 'CDK');

    // ========================================================================
    // Lambda Execution Role
    // ========================================================================

    this.lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `hotel-lambda-execution-${environment}-${this.region}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });

    // Grant DynamoDB access
    this.roomsTable.grantReadWriteData(this.lambdaExecutionRole);

    cdk.Tags.of(this.lambdaExecutionRole).add('Environment', environment);
    cdk.Tags.of(this.lambdaExecutionRole).add('Application', 'HotelManagement');

    // ========================================================================
    // CloudWatch Log Group
    // ========================================================================

    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/hotel-api-${environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================================================
    // Lambda Function
    // ========================================================================

    this.apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `hotel-api-${environment}`,
      description: 'Main API handler - routes all requests to appropriate handlers',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/handlers/router.handler',
      code: lambda.Code.fromAsset('../backend', {
        exclude: ['node_modules', 'dist', 'coverage', 'test-results', '*.test.ts', '*.property.test.ts'],
      }),
      role: this.lambdaExecutionRole,
      environment: {
        HOTEL_NAME: hotelName,
        DYNAMODB_TABLE_NAME: this.roomsTable.tableName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        ENVIRONMENT: environment,
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      architecture: lambda.Architecture.X86_64,
      logGroup: apiLogGroup,
    });

    cdk.Tags.of(this.apiFunction).add('Environment', environment);
    cdk.Tags.of(this.apiFunction).add('Function', 'ApiRouter');

    // ========================================================================
    // API Gateway
    // ========================================================================

    this.api = new apigateway.RestApi(this, 'HotelApi', {
      restApiName: `hotel-api-${environment}`,
      description: 'Hotel Management REST API',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: environment,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    cdk.Tags.of(this.api).add('Environment', environment);
    cdk.Tags.of(this.api).add('Application', 'HotelManagement');

    // API Gateway Resources
    const apiResource = this.api.root.addResource('api');
    const proxyResource = apiResource.addResource('{proxy+}');

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.apiFunction, {
      proxy: true,
    });

    // Add ANY method to proxy resource
    proxyResource.addMethod('ANY', lambdaIntegration);

    // Grant API Gateway permission to invoke Lambda
    this.apiFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    // CloudWatch Log Group for API Gateway
    const apiGatewayLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/hotel-api-${environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================================================
    // Stack Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway endpoint URL for the application',
      exportName: `${this.stackName}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: `${this.stackName}-ApiId`,
    });

    new cdk.CfnOutput(this, 'ApiStage', {
      value: environment,
      description: 'API Gateway stage name',
      exportName: `${this.stackName}-ApiStage`,
    });

    new cdk.CfnOutput(this, 'RoomsTableName', {
      value: this.roomsTable.tableName,
      description: 'DynamoDB table name for rooms',
      exportName: `${this.stackName}-RoomsTable`,
    });

    new cdk.CfnOutput(this, 'RoomsTableArn', {
      value: this.roomsTable.tableArn,
      description: 'DynamoDB table ARN',
      exportName: `${this.stackName}-RoomsTableArn`,
    });

    new cdk.CfnOutput(this, 'ApiFunctionArn', {
      value: this.apiFunction.functionArn,
      description: 'API Lambda Function ARN',
      exportName: `${this.stackName}-ApiFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ApiFunctionName', {
      value: this.apiFunction.functionName,
      description: 'API Lambda Function name',
      exportName: `${this.stackName}-ApiFunctionName`,
    });

    new cdk.CfnOutput(this, 'LambdaExecutionRoleArn', {
      value: this.lambdaExecutionRole.roleArn,
      description: 'Lambda execution role ARN',
      exportName: `${this.stackName}-LambdaRoleArn`,
    });
  }
}
