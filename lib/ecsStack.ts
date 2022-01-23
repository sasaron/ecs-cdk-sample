import {
  Stack,
  StackProps,
  Duration,
  aws_ecs as ecs,
  aws_ec2 as ec2,
  aws_ecs_patterns as ecsP,
  aws_ssm as ssm,
  aws_ecr as ecr,
} from 'aws-cdk-lib';
import { IConfig } from 'config';
import { Construct } from 'constructs';

export interface ECSStackProps extends StackProps {
  readonly vpc: ec2.IVpc
  readonly config: IConfig
  readonly prefix: string
}

export class ECSStack extends Stack {
  public readonly ecsToRDSSecurityGroup: ec2.ISecurityGroup;
  constructor(scope: Construct, id: string,  props: ECSStackProps) {
    super(scope, id, props);
    const vpc = props.vpc;


    const ssmParameterPrefix = `/${props.config.get("app.name")}/${props.config.get("app.env")}`
    const cluster = new ecs.Cluster(this, `${props.prefix}ECSCluster`, { vpc })
    this.ecsToRDSSecurityGroup = new ec2.SecurityGroup(this, `${props.prefix}ECStoRDSSecurityGroup`, { vpc });

    const rotation = Number(ssm.StringParameter.valueForStringParameter(this, `${ssmParameterPrefix}/RDS/Rotation`));
    const repo = ecr.Repository.fromRepositoryName(this, `${props.prefix}ECSApplicationRepository`, props.config.get("ecs.application.image"))

    const ecsService = new ecsP.ApplicationLoadBalancedFargateService(this, `${props.prefix}ApplicationLoadBalancedFargateService`, {
      cluster,
      serviceName: `${props.prefix}ECSAppService`,
      memoryLimitMiB: props.config.get("ecs.memory"),
      desiredCount: props.config.get("ecs.desiredCount"),
      cpu: props.config.get("ecs.cpu"),
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repo),
        environment: {
          ENDPOINT: ssm.StringParameter.valueForStringParameter(this, `${ssmParameterPrefix}/RDS/Endpoint`),
          USER: ssm.StringParameter.valueForStringParameter(this, `${ssmParameterPrefix}/RDS/User`),
          DATABASE: ssm.StringParameter.valueForStringParameter(this, `${ssmParameterPrefix}/RDS/Database`),
        },
        secrets: {
          PASS: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(this, `${props.prefix}RDSPassword`, {
              parameterName: `${ssmParameterPrefix}/RDS/Password`,
              version: rotation
            }))
        },
      },
      publicLoadBalancer: true,
      securityGroups: [this.ecsToRDSSecurityGroup],
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY
      },
      circuitBreaker: { rollback: true }
    });

    const scalableTarget = ecsService.service.autoScaleTaskCount({
      minCapacity: props.config.get("ecs.minCapacity"),
      maxCapacity: props.config.get("ecs.maxCapacity")
    });

    scalableTarget.scaleOnCpuUtilization(`${props.prefix}ECSServiceCPUScaling`, {
      targetUtilizationPercent: props.config.get("ecs.CPUScaling"),
      scaleInCooldown: Duration.minutes(1),
      scaleOutCooldown: Duration.seconds(30),
    });

    scalableTarget.scaleOnMemoryUtilization(`${props.prefix}ECSServiceMemoryScaling`, {
      targetUtilizationPercent: props.config.get("ecs.MemoryScaling"),
      scaleInCooldown: Duration.minutes(1),
      scaleOutCooldown: Duration.seconds(30),
    });
    
  }
}
