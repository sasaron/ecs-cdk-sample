import {
  Stack,
  StackProps,
  aws_rds as rds,
  aws_ec2 as ec2,
  SecretValue,
  aws_ssm as ssm
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class RDSSampleStack extends Stack {
  public readonly rdsCluster: rds.IDatabaseCluster;
  public readonly rdsSecurityGroup: ec2.ISecurityGroup;
  constructor(scope: Construct, id: string, vpc: ec2.IVpc, props?: StackProps) {
    super(scope, id, props);

    const user = ssm.StringParameter.valueForStringParameter(this, '/ECSSample/Dev/RDS/User');
    const rotation = ssm.StringParameter.valueForStringParameter(this, '/ECSSample/Dev/RDS/Rotation'); // あまり良くないかも
    const password = SecretValue.ssmSecure('/ECSSample/Dev/RDS/Password', rotation);

    this.rdsSecurityGroup = new ec2.SecurityGroup(this,'RDSSecurityGroup', {vpc});
    this.rdsCluster = new rds.DatabaseCluster(this, 'SampleAuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_3_01_0 }),
      credentials: rds.Credentials.fromPassword(user, password),

      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [this.rdsSecurityGroup],
        vpc,
      },
    });
  }
}
