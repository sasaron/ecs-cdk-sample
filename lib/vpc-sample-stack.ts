import { Stack, StackProps, aws_ec2 as ec2, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class VPCSampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'ECSSampleVPC', {
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
          name: 'protected',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ],
      vpnRoutePropagation: [
        {
          availabilityZones: [],
        }
      ]
    });
    Tags.of(vpc).add('Name', 'VPCSampleStack');
  }
}
