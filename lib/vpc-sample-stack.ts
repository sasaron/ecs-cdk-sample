import { Stack, StackProps, aws_ec2 as ec2, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class VPCSampleStack extends Stack {
  public readonly vpc : ec2.IVpc;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.vpc = new ec2.Vpc(this, 'ECSSampleVPC', {
      cidr: "192.168.0.0/21",
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        },
        {
          cidrMask: 24,
          name: 'protected',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ],
      vpnRoutePropagation: [
        {
          availabilityZones: [],
        }
      ]
    });
    this.vpc.addGatewayEndpoint("s3-endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnets: this.vpc.privateSubnets
        }
      ]
    })
    this.vpc.addInterfaceEndpoint("ecr-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR
    })
    this.vpc.addInterfaceEndpoint("ecr-docker-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER
    })
    this.vpc.addInterfaceEndpoint("ssm-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SSM
    })
    Tags.of(this.vpc).add('Name', 'VPCSampleStack');
 }
}
