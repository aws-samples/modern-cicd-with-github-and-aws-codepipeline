import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface FrontendPipelineStackProps extends cdk.StackProps {
  frontendBucket: s3.IBucket;
  cloudFrontDistribution: cloudfront.CloudFrontWebDistribution;
  artifactsBucket: s3.IBucket;
  codeBuildRole: iam.IRole;
  codePipelineRole: iam.IRole;
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Frontend Pipeline Stack (Lab 2 Accelerator)
 * 
 * Creates a CI/CD pipeline for the React frontend:
 * - Source stage: GitHub via CodeConnections
 * - Test stage: Unit tests and property-based tests
 * - Build stage: Production build
 * - Deploy stage: S3 upload and CloudFront invalidation
 * 
 * This stack corresponds to Workshop Lab 2 and provides an accelerated
 * way to set up the frontend pipeline without manual configuration.
 * 
 * Workshop Module: Lab 2 - Frontend Pipeline
 */
export class FrontendPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: FrontendPipelineStackProps) {
    super(scope, id, props);

    // ========================================================================
    // CodeBuild Projects
    // ========================================================================

    // Test project
    const testProject = new codebuild.PipelineProject(this, 'FrontendTestProject', {
      projectName: 'hotel-frontend-test',
      description: 'Run frontend unit tests and property-based tests',
      role: props.codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('frontend/buildspec-test.yml'),
    });

    // Build project
    const buildProject = new codebuild.PipelineProject(this, 'FrontendBuildProject', {
      projectName: 'hotel-frontend-build',
      description: 'Build React application for production',
      role: props.codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('frontend/buildspec-build.yml'),
    });

    // ========================================================================
    // Pipeline
    // ========================================================================

    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    this.pipeline = new codepipeline.Pipeline(this, 'FrontendPipeline', {
      pipelineName: 'hotel-frontend-pipeline',
      role: props.codePipelineRole,
      artifactBucket: props.artifactsBucket,
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
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Run_Tests',
              project: testProject,
              input: sourceOutput,
              outputs: [testOutput],
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_React_App',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.S3DeployAction({
              actionName: 'Deploy_to_S3',
              bucket: props.frontendBucket,
              input: buildOutput,
              extract: true,
            }),
          ],
        },
      ],
    });

    // ========================================================================
    // Stack Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Frontend CI/CD pipeline name',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'Frontend CI/CD pipeline ARN',
    });
  }
}
