import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface FrontendPipelineStackProps extends cdk.StackProps {
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Frontend Pipeline Stack (Lab 2 Accelerator)
 *
 * Creates a CI/CD pipeline for the React frontend:
 * - Source: GitHub via CodeConnections
 * - Test: unit and property-based tests
 * - Build: production build
 * - Deploy: upload to the frontend S3 bucket
 *
 * The base infrastructure (frontend bucket, artifacts bucket, CodeBuild role)
 * is created during provisioning by base-infra.yaml and imported here from SSM,
 * so this stack does not recreate it.
 *
 * Workshop Module: Lab 2 - Frontend Pipeline
 */
export class FrontendPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: FrontendPipelineStackProps) {
    super(scope, id, props);

    // Import provisioned base infrastructure from SSM (published by base-infra.yaml)
    const artifactsBucket = s3.Bucket.fromBucketName(
      this,
      'ArtifactsBucket',
      ssm.StringParameter.valueForStringParameter(this, '/hotelapp/s3/PipelineArtifactsBucketName'),
    );
    const frontendBucket = s3.Bucket.fromBucketName(
      this,
      'FrontendBucket',
      ssm.StringParameter.valueForStringParameter(this, '/hotelapp/s3/FrontendBucketName'),
    );
    const codeBuildRole = iam.Role.fromRoleArn(
      this,
      'CodeBuildRole',
      ssm.StringParameter.valueForStringParameter(this, '/hotelapp/roles/CodeBuildFrontEndRoleArn'),
      { mutable: true },
    );

    // ========================================================================
    // CodeBuild Projects
    // ========================================================================

    const testProject = new codebuild.PipelineProject(this, 'FrontendTestProject', {
      projectName: 'hotel-frontend-test',
      description: 'Run frontend unit tests and property-based tests',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('frontend/buildspec-test.yml'),
    });

    const buildProject = new codebuild.PipelineProject(this, 'FrontendBuildProject', {
      projectName: 'hotel-frontend-build',
      description: 'Build React application for production',
      role: codeBuildRole,
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
              bucket: frontendBucket,
              input: buildOutput,
              extract: true,
            }),
          ],
        },
      ],
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Frontend CI/CD pipeline name',
    });
  }
}
