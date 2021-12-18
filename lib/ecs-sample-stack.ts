import {
  Stack,
  StackProps,
  Fn,
  aws_ecs as ecs,
  aws_ec2 as ec2,
  aws_ecs_patterns as ecsp
} from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class EcsSampleStack extends Stack {
  constructor(scope: Construct, id: string, vpc: IVpc, props?: StackProps) {
    super(scope, id, props);
    const cluster = new ecs.Cluster(this, 'SampleEcsCluster', { vpc })

    new ecsp.ApplicationLoadBalancedFargateService(this, 'SampleWebService', {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      },
      publicLoadBalancer: true,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY
      },
      circuitBreaker: { rollback: true }
    });
  }
}
