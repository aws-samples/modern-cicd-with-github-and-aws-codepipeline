import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface AdvancedPipelineStackProps extends cdk.StackProps {
  environment: string;
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Advanced Pipeline Stack (Lab 5 Accelerator)
 *
 * Demonstrates the pipeline-refinement concepts from Lab 5:
 * - A manual approval gate before the backend deploy
 * - SNS notifications for approvals and alarms
 * - A CloudWatch alarm on backend Lambda errors that can drive rollback decisions
 *
 * Deeper Lab 5 topics (Lambda aliases/versions, API Gateway stages, and
 * CodePipeline automatic stage-level rollback) are covered in the manual lab.
 * The artifacts bucket is imported from SSM (published by base-infra.yaml).
 *
 * Workshop Module: Lab 5 - Pipeline Refinements
 */
export class AdvancedPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly notificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: AdvancedPipelineStackProps) {
    super(scope, id, props);

    const artifactsBucket = s3.Bucket.fromBucketName(
      this,
      'ArtifactsBucket',
      ssm.StringParameter.valueForStringParameter(this, '/hotelapp/s3/PipelineArtifactsBucketName'),
    );

    const backendStackName = `hotel-backend-${props.environment}`;

    // Notifications for approvals and alarms
    this.notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: 'hotel-pipeline-notifications',
      displayName: 'Hotel pipeline approvals and alarms',
    });

    // Alarm on backend Lambda errors (referenced by function name to avoid a
    // cross-stack construct dependency). Drives rollback/awareness in Lab 5.
    const lambdaErrors = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: { FunctionName: `hotel-api-${props.environment}` },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    const errorAlarm = new cloudwatch.Alarm(this, 'BackendErrorsAlarm', {
      alarmName: 'hotel-backend-errors',
      metric: lambdaErrors,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    errorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.notificationTopic));

    // Pipeline with a manual approval gate before deploying the backend.
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    this.pipeline = new codepipeline.Pipeline(this, 'AdvancedPipeline', {
      pipelineName: 'hotel-advanced-pipeline',
      artifactBucket: artifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeStarConnectionsSourceAction({
              actionName: 'GitHub_Source',
              owner: props.githubRepo.split('/')[0],
              repo: props.githubRepo.split('/')[1],
              branch: props.githubBranch,
              connectionArn: props.codeConnectionArn,
              output: sourceOutput,
              triggerOnPush: true,
            }),
          ],
        },
        {
          stageName: 'Approve',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Approve_Production_Deploy',
              notificationTopic: this.notificationTopic,
              additionalInformation: 'Approve to deploy the backend stack to production.',
            }),
          ],
        },
        {
          stageName: 'Deploy_Backend',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy_Backend_Stack',
              stackName: backendStackName,
              templatePath: sourceOutput.atPath('backend/backend.yml'),
              adminPermissions: true,
              parameterOverrides: {
                HotelName: 'Hotel Yorba',
                Environment: props.environment,
              },
            }),
          ],
        },
      ],
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Advanced CI/CD pipeline name',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: this.notificationTopic.topicArn,
      description: 'SNS topic for pipeline approvals and alarms',
    });
  }
}
