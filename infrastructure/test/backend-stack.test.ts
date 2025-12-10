import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { BackendStack } from '../lib/backend-stack';

describe('BackendStack', () => {
  let app: cdk.App;
  let stack: BackendStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new BackendStack(app, 'TestBackendStack', {
      env: { account: '123456789012', region: 'us-west-2' },
      hotelName: 'Test Hotel',
      environment: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'N',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('creates exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'dist/handlers/router.handler',
        MemorySize: 512,
        Timeout: 10,
        Environment: {
          Variables: {
            HOTEL_NAME: 'Test Hotel',
            ENVIRONMENT: 'test',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
      });
    });

    test('creates exactly one Lambda function', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1);
    });
  });

  describe('IAM Role', () => {
    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('grants DynamoDB permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'hotel-api-test',
        Description: 'Hotel Management REST API',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates API Gateway deployment', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {});
    });

    test('creates API Gateway stage with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'test',
        TracingEnabled: true,
        MethodSettings: [
          {
            ResourcePath: '/*',
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
            ThrottlingBurstLimit: 5000,
            ThrottlingRateLimit: 10000,
          },
        ],
      });
    });

    test('creates API Gateway resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'api',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{proxy+}',
      });
    });

    test('creates API Gateway method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'ANY',
        AuthorizationType: 'NONE',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('creates log group for Lambda function', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/hotel-api-test',
        RetentionInDays: 7,
      });
    });

    test('creates log group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/hotel-api-test',
        RetentionInDays: 7,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports API URL', () => {
      template.hasOutput('ApiUrl', {
        Export: {
          Name: 'TestBackendStack-ApiUrl',
        },
      });
    });

    test('exports API ID', () => {
      template.hasOutput('ApiId', {
        Export: {
          Name: 'TestBackendStack-ApiId',
        },
      });
    });

    test('exports DynamoDB table name', () => {
      template.hasOutput('RoomsTableName', {
        Export: {
          Name: 'TestBackendStack-RoomsTable',
        },
      });
    });

    test('exports Lambda function ARN', () => {
      template.hasOutput('ApiFunctionArn', {
        Export: {
          Name: 'TestBackendStack-ApiFunctionArn',
        },
      });
    });
  });
});
