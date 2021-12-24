import {
  Stack,
  StackProps,
  aws_ecs as ecs,
  aws_ec2 as ec2,
  aws_ecs_patterns as ecsp,
  aws_ssm as ssm,
  aws_ecr as ecr
} from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class EcsSampleStack extends Stack {
  public readonly ecsToRDSSecurityGroup: ec2.ISecurityGroup;
  constructor(scope: Construct, id: string, vpc: IVpc, props?: StackProps) {
    super(scope, id, props);
    const cluster = new ecs.Cluster(this, 'SampleEcsCluster', { vpc })
    this.ecsToRDSSecurityGroup = new ec2.SecurityGroup(this,'ECStoRDSSecurityGroup', {vpc});
    const rotation = Number(ssm.StringParameter.valueForStringParameter(this, '/ECSSample/Dev/RDS/Rotation'));
    const repo = ecr.Repository.fromRepositoryName(this, 'RDSConnectTestRepo', 'rds-connect-test')
    

    new ecsp.ApplicationLoadBalancedFargateService(this, 'SampleWebService', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repo),
        environment: {
          ENDPOINT: ssm.StringParameter.valueForStringParameter(this, '/ECSSample/Dev/RDS/Endpoint'),
          USER: ssm.StringParameter.valueForStringParameter(this, '/ECSSample/Dev/RDS/User'),
          DATABASE: ssm.StringParameter.valueForStringParameter(this, '/ECSSample/Dev/RDS/DataBase'),
        },
        secrets: {
          PASS: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(this, 'RDSPassWord',{
              parameterName: '/ECSSample/Dev/RDS/Password',
              version: rotation
            }))
        },
    },
      publicLoadBalancer: true,
      securityGroups: [ this.ecsToRDSSecurityGroup ] ,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY
      },
      circuitBreaker: { rollback: true }
    });
  }
}
