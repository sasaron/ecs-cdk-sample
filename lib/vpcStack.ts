import { Stack, StackProps, aws_ec2 as ec2, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IConfig } from 'config';

export interface VPCStackProps extends StackProps {
  readonly config: IConfig
  readonly prefix: string
}

export class VPCStack extends Stack {
  public readonly vpc : ec2.IVpc;
  constructor(scope: Construct, id: string, props: VPCStackProps) {
    super(scope, id, props);
    this.vpc = new ec2.Vpc(this, `${props.prefix}${id}`, {
      cidr: props.config.get('network.cidr'),
      maxAzs: props.config.get('network.maxAzs'),
      subnetConfiguration: [
        {
          cidrMask: props.config.get('network.public.cidrMask'),
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: props.config.get('network.private.cidrMask'),
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        },
        {
          cidrMask: props.config.get('network.protected.cidrMask'),
          name: 'protected',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ],
    });

    // VPCEndpoint
    const s3Endpoint = this.vpc.addGatewayEndpoint("s3-endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });
    const ecrEndpoint = this.vpc.addInterfaceEndpoint("ecr-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR
    });
    const ecrDockerEndpoint = this.vpc.addInterfaceEndpoint("ecr-docker-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER
    });
    const ssmEndpoint = this.vpc.addInterfaceEndpoint("ssm-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SSM
    });

    // Tagging
    Tags.of(this.vpc).add('Name', `${props.prefix}VPC`);
    Tags.of(this.vpc).add('ENV', props.config.get('app.env'));
    Tags.of(this.vpc).add('Application', props.config.get('app.name'));

    Tags.of(s3Endpoint).add('Name', `${props.prefix}S3Endpoint`);
    Tags.of(s3Endpoint).add('ENV', props.config.get('app.env'));
    Tags.of(s3Endpoint).add('Application', props.config.get('app.name'));

    Tags.of(ecrEndpoint).add('Name', `${props.prefix}ECREndpoint`);
    Tags.of(ecrEndpoint).add('ENV', props.config.get('app.env'));
    Tags.of(ecrEndpoint).add('Application', props.config.get('app.name'));

    Tags.of(ecrDockerEndpoint).add('Name', `${props.prefix}ECRDockerEndpoint`);
    Tags.of(ecrDockerEndpoint).add('ENV', props.config.get('app.env'));
    Tags.of(ecrDockerEndpoint).add('Application', props.config.get('app.name'));

    Tags.of(ssmEndpoint).add('Name', `${props.prefix}SSMEndpoint`);
    Tags.of(ssmEndpoint).add('ENV', props.config.get('app.env'));
    Tags.of(ssmEndpoint).add('Application', props.config.get('app.name'));
 }
}