import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface BackendPipelineStackProps extends cdk.StackProps {
  environment: string;
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Backend Pipeline Stack (Lab 3 Accelerator)
 *
 * Creates a CI/CD pipeline for the Lambda backend:
 * - Source: GitHub via CodeConnections
 * - Test: unit and property-based tests
 * - Validate: CloudFormation validation / cfn_nag
 * - Deploy: CloudFormation deploy of backend/backend.yml to hotel-backend-<env>
 *
 * The artifacts bucket and CodeBuild role are created during provisioning by
 * base-infra.yaml and imported here from SSM.
 *
 * Workshop Module: Lab 3 - Backend Pipeline
 */
export class BackendPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: BackendPipelineStackProps) {
    super(scope, id, props);

    // Import provisioned base infrastructure from SSM (published by base-infra.yaml)
    const artifactsBucket = s3.Bucket.fromBucketName(
      this,
      'ArtifactsBucket',
      ssm.StringParameter.valueForStringParameter(this, '/hotelapp/s3/PipelineArtifactsBucketName'),
    );
    const codeBuildRole = iam.Role.fromRoleArn(
      this,
      'CodeBuildRole',
      ssm.StringParameter.valueForStringParameter(this, '/hotelapp/roles/CodeBuildBackEndRoleArn'),
      { mutable: true },
    );

    // CloudFormation stack the pipeline deploys the backend into. Kept distinct
    // from the CDK-managed HotelBackendStack to avoid two stacks owning one name.
    const backendStackName = `hotel-backend-${props.environment}`;

    // ========================================================================
    // CodeBuild Projects
    // ========================================================================

    const testProject = new codebuild.PipelineProject(this, 'BackendTestProject', {
      projectName: 'hotel-backend-test',
      description: 'Run backend unit tests and property-based tests',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('backend/buildspec-test.yml'),
    });

    const validateProject = new codebuild.PipelineProject(this, 'BackendValidateProject', {
      projectName: 'hotel-backend-validate',
      description: 'Validate CloudFormation template and run security checks',
      role: codeBuildRole,
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
      description: 'Backend CI/CD pipeline name',
    });
  }
}
