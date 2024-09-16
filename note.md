Get workshop studio to deploy two stacks to support branching strategy later:

Whats nice about this is the deploy command will create or update the stack

1.  - dev

      ```
      aws --region=us-west-2 cloudformation deploy \
      --template-file base-infra.yaml \
      --stack-name BaseInfraStack-dev \
      --capabilities CAPABILITY_NAMED_IAM
      ```

    - prod
      ```
      aws --region=us-west-2 cloudformation deploy \
      --template-file base-infra.yaml \
      --stack-name BaseInfraStack-prod \
      --capabilities CAPABILITY_NAMED_IAM
      ```

unit tests : npx jest

2.  Github Code Connection
    git remote set-url origin codecommit::us-west-2://hotel-app

3.  Create the v2 pipeline

4.  We get the Workshop students to make the front end part of the pipeline
5.

6.  We get the Workshop students to update the base stack in the code with this cloud formation

```
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  AppRunnerService:
    Type: AWS::AppRunner::Service
    Properties:
      SourceConfiguration:
        ImageRepository:
          ImageIdentifier: !Sub arn:aws:ecr:${AWS::Region}:${AWS::AccountId}:repository/hotel-app:dev
          ImageRepositoryType: ECR
          ImageConfiguration:
            Port: "8080"
            RuntimeEnvironmentVariables:
              MYSQL_SECRET: !Ref DBSecret  # Reference to DBSecret from base-infra.yaml
              HOTEL_NAME: !Ref HotelName   # Reference to HotelName from base-infra.yaml

      InstanceConfiguration:
        Cpu: "1 vCPU"
        Memory: "2 GB"

      HealthCheckConfiguration:
        Protocol: HTTP
        Path: "/"
        Interval: 10
        Timeout: 5
        HealthyThreshold: 1
        UnhealthyThreshold: 5

      NetworkConfiguration:
        EgressConfiguration:
          EgressType: VPC
          VpcConnectorArn: !Sub arn:aws:apprunner:${AWS::Region}:${AWS::AccountId}:vpc-connector/AppRunnerV2NPrototype-RDS-Connector # Reference to VPC Connector from base-infra.yaml

      ServiceName: AppRunnerHotelService
      RoleArn: !GetAtt AppRunnerHotelAppRole.Arn  # Reference to AppRunnerHotelAppRole from base-infra.yaml

      ObservabilityConfiguration:
        TraceConfiguration:
          Vendor: AWSXRAY

Outputs:
  AppRunnerServiceUrl:
    Description: "URL of the App Runner Service"
    Value: !GetAtt AppRunnerService.ServiceUrl
```
