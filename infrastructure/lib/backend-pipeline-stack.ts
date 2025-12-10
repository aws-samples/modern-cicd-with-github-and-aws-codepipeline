import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BackendStack } from './backend-stack';

export interface BackendPipelineStackProps extends cdk.StackProps {
  backendStack: BackendStack;
  artifactsBucket: s3.IBucket;
  codeBuildRole: iam.IRole;
  codePipelineRole: iam.IRole;
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Backend Pipeline Stack (Lab 3 Accelerator)
 * 
 * Creates a CI/CD pipeline for the Lambda backend:
 * - Source stage: GitHub via CodeConnections
 * - Test stage: Unit tests and property-based tests
 * - Validate stage: CloudFormation validation and cfn_nag
 * - Deploy stage: CloudFormation stack deployment
 * 
 * This stack corresponds to Workshop Lab 3 and provides an accelerated
 * way to set up the backend pipeline without manual configuration.
 * 
 * Workshop Module: Lab 3 - Backend Pipeline
 */
export class BackendPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: BackendPipelineStackProps) {
    super(scope, id, props);

    // ========================================================================
    // CodeBuild Projects
    // ========================================================================

    // Test project
    const testProject = new codebuild.PipelineProject(this, 'BackendTestProject', {
      projectName: 'hotel-backend-test',
      description: 'Run backend unit tests and property-based tests',
      role: props.codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('backend/buildspec-test.yml'),
    });

    // Validate project
    const validateProject = new codebuild.PipelineProject(this, 'BackendValidateProject', {
      projectName: 'hotel-backend-validate',
      description: 'Validate CloudFormation template and run security checks',
      role: props.codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('backend/buildspec-validate.yml'),
    });

    // ========================================================================
    // Pipeline
    // ========================================================================

    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');
    const validateOutput = new codepipeline.Artifact('ValidateOutput');

    this.pipeline = new codepipeline.Pipeline(this, 'BackendPipeline', {
      pipelineName: 'hotel-backend-pipeline',
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
          stageName: 'Validate',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Validate_CloudFormation',
              project: validateProject,
              input: sourceOutput,
              outputs: [validateOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy_Backend_Stack',
              stackName: props.backendStack.stackName,
              templatePath: sourceOutput.atPath('backend/backend.yml'),
              adminPermissions: true,
              parameterOverrides: {
                HotelName: 'Hotel Yorba',
                Environment: 'dev',
              },
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
      description: 'Backend CI/CD pipeline name',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'Backend CI/CD pipeline ARN',
    });
  }
}
