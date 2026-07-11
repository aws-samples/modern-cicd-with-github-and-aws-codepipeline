import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BackendStack } from './backend-stack';

export interface DeploymentStackProps extends cdk.StackProps {
  frontendBucket: s3.IBucket;
  cloudFrontDistribution: cloudfront.CloudFrontWebDistribution;
  backendStack: BackendStack;
  artifactsBucket: s3.IBucket;
  codeBuildFrontEndRole: iam.IRole;
  codeBuildBackEndRole: iam.IRole;
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Deployment Stack (Lab 4 Accelerator)
 *
 * Creates a single pipeline that deploys the full stack in order:
 * - Source: GitHub via CodeConnections
 * - Deploy Backend: CloudFormation deploy of backend.yml (Lambda, API Gateway, DynamoDB)
 * - Build Frontend: production React build
 * - Deploy Frontend: upload to S3 (served via CloudFront)
 *
 * This mirrors the manual Lab 4 goal of deploying the complete serverless
 * application from one coordinated pipeline. CDK creates a dedicated,
 * least-privilege pipeline role in this stack to avoid cross-stack cycles.
 *
 * Workshop Module: Lab 4 - Continuous Deployment
 */
export class DeploymentStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    // Import the shared CodeBuild role by ARN (mutable) so project-scoped grants
    // land in this stack rather than BaseInfraStack — avoids a cyclic dependency.
    const codeBuildFrontEndRole = iam.Role.fromRoleArn(
      this,
      'ImportedDeploymentFrontEndRole',
      props.codeBuildFrontEndRole.roleArn,
      { mutable: true },
    );

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
          stageName: 'Deploy_Backend',
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
              bucket: props.frontendBucket,
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
