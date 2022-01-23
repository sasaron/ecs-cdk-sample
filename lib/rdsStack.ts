import {
  Stack,
  StackProps,
  aws_rds as rds,
  aws_ec2 as ec2,
  SecretValue,
  aws_ssm as ssm,
  Tags
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IConfig } from 'config';

export interface RDSStackProps extends StackProps {
  readonly vpc: ec2.IVpc
  readonly config: IConfig
  readonly prefix: string
}

export class RDSStack extends Stack {
  public readonly rdsCluster: rds.IDatabaseCluster;
  public readonly rdsSecurityGroup: ec2.ISecurityGroup;
  constructor(scope: Construct, id: string, props: RDSStackProps) {
    super(scope, id, props);

    const ssmParameterPrefix = `/${props.config.get("app.name")}/${props.config.get("app.env")}`;
    const user = ssm.StringParameter.valueForStringParameter(this, `${ssmParameterPrefix}/RDS/User`);
    const rotation = ssm.StringParameter.valueForStringParameter(this, `${ssmParameterPrefix}/RDS/Rotation`);
    const password = SecretValue.ssmSecure(`${ssmParameterPrefix}/RDS/Password`, rotation);
    const database = ssm.StringParameter.valueForStringParameter(this, `${ssmParameterPrefix}/RDS/Database`);

    const vpc = props.vpc;

    const rdsSG = this.rdsSecurityGroup = new ec2.SecurityGroup(this, `${props.prefix}RDSSecurityGroup`, {
      vpc,
      allowAllOutbound: true,
    });

    this.rdsCluster = new rds.DatabaseCluster(this, `${props.prefix}RDSCluster`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({ version: props.config.get("rds.version") }),
      credentials: rds.Credentials.fromPassword(user, password),
      defaultDatabaseName: database,
      instanceProps: {
        instanceType: ec2.InstanceType.of(props.config.get("rds.instance.type"), props.config.get("rds.instance.size")),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [this.rdsSecurityGroup],
        vpc,
      },
    });

    new ssm.StringParameter(this, 'RDSEndpoint', {
      stringValue: this.rdsCluster.clusterEndpoint.hostname,
      type: ssm.ParameterType.STRING,
      parameterName: `${ssmParameterPrefix}/RDS/Endpoint`
    });

    Tags.of(rdsSG).add('Name', `${props.prefix}RDSSecurityGroup`);
    Tags.of(rdsSG).add('ENV', props.config.get('app.env'));
    Tags.of(rdsSG).add('Application', props.config.get('app.name'));

    Tags.of(this.rdsCluster).add('Name', `${props.prefix}RDSCluster`);
    Tags.of(this.rdsCluster).add('ENV', props.config.get('app.env'));
    Tags.of(this.rdsCluster).add('Application', props.config.get('app.name'));
  }
}
