import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface DeploymentStackProps extends cdk.StackProps {
  environment: string;
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Deployment Stack (Lab 4 Accelerator)
 *
 * A single pipeline that deploys the full stack in order:
 * - Source: GitHub via CodeConnections
 * - Deploy Backend: CloudFormation deploy of backend/backend.yml to hotel-backend-<env>
 * - Build Frontend: production React build
 * - Deploy Frontend: upload to the provisioned frontend S3 bucket
 *
 * Base infrastructure (frontend bucket, artifacts bucket, CodeBuild role) is
 * imported from SSM (published by base-infra.yaml during provisioning).
 *
 * Workshop Module: Lab 4 - Continuous Deployment
 */
export class DeploymentStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

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
    const codeBuildFrontEndRole = iam.Role.fromRoleArn(
      this,
      'CodeBuildFrontEndRole',
      ssm.StringParameter.valueForStringParameter(this, '/hotelapp/roles/CodeBuildFrontEndRoleArn'),
      { mutable: true },
    );

    const backendStackName = `hotel-backend-${props.environment}`;

    const frontendBuildProject = new codebuild.PipelineProject(this, 'FullStackFrontendBuild', {
      projectName: 'hotel-fullstack-frontend-build',
      description: 'Build the React frontend for the full-stack deployment pipeline',
      role: codeBuildFrontEndRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('frontend/buildspec-build.yml'),
    });

    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const frontendBuildOutput = new codepipeline.Artifact('FrontendBuildOutput');

    this.pipeline = new codepipeline.Pipeline(this, 'DeploymentPipeline', {
      pipelineName: 'hotel-fullstack-pipeline',
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
        {
          stageName: 'Build_Frontend',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_React_App',
              project: frontendBuildProject,
              input: sourceOutput,
              outputs: [frontendBuildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy_Frontend',
          actions: [
            new codepipeline_actions.S3DeployAction({
              actionName: 'Deploy_to_S3',
              bucket: frontendBucket,
              input: frontendBuildOutput,
              extract: true,
            }),
          ],
        },
      ],
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Full-stack deployment pipeline name',
    });
  }
}
