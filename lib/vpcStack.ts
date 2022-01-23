import { Stack, StackProps, aws_ec2 as ec2, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IConfig } from 'config';
import { disconnect } from 'process';

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

    // NetworkACL
    const publicNetworkAcl = new ec2.NetworkAcl(this, `${props.prefix}PublicACL`, {
      networkAclName: `${props.prefix}PublicACL`,
      vpc: this.vpc,
      subnetSelection: { subnets: this.vpc.publicSubnets }
    });
    this.publicNetworkAclEntry(publicNetworkAcl, ec2.TrafficDirection.EGRESS);
    this.publicNetworkAclEntry(publicNetworkAcl, ec2.TrafficDirection.INGRESS);

    const privateNetworkAcl = new ec2.NetworkAcl(this, `${props.prefix}PrivateACL`, {
      networkAclName: `${props.prefix}PrivateACL`,
      vpc: this.vpc,
      subnetSelection: { subnets: this.vpc.privateSubnets }
    });
    this.privateIngressNetworkAclEntry(privateNetworkAcl, props.config.get('network.cidr'));
    this.privateEgressNetworkAclEntry(privateNetworkAcl);

    const protectedNetworkAcl = new ec2.NetworkAcl(this, `${props.prefix}ProtectedACL`, {
      networkAclName: `${props.prefix}Protected`,
      vpc: this.vpc,
      subnetSelection: {subnets: this.vpc.isolatedSubnets }
    })
    this.protectedNetworkAclEntry(protectedNetworkAcl, ec2.TrafficDirection.EGRESS, this.vpc);
    this.protectedNetworkAclEntry(protectedNetworkAcl, ec2.TrafficDirection.INGRESS, this.vpc);

    // VPCEndpoint
    this.vpc.addGatewayEndpoint("s3Endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });
    this.vpc.addInterfaceEndpoint("ecrEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR
    });
    this.vpc.addInterfaceEndpoint("ecrDockerEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER
    });
    this.vpc.addInterfaceEndpoint("ssmEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SSM
    });
    this.vpc.addInterfaceEndpoint("cloudwatchLogsEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
    });

    // Tagging
    Tags.of(this.vpc).add('Name', `${props.prefix}VPC`);
    Tags.of(this.vpc).add('ENV', props.config.get('app.env'));
    Tags.of(this.vpc).add('Application', props.config.get('app.name'));
 }

 private publicNetworkAclEntry(nacl: ec2.INetworkAcl, direction: ec2.TrafficDirection) {
  const entryNamePrefix = direction === ec2.TrafficDirection.INGRESS ? "Ingress" : "Egress";
  nacl.addEntry(`${entryNamePrefix}ICMP`, {
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 100,
    networkAclEntryName: 'ICMP',
    traffic: ec2.AclTraffic.icmp({code: -1, type: -1}),
    direction: direction,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`${entryNamePrefix}HTTP`, {
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 110,
    networkAclEntryName: 'HTTP',
    traffic: ec2.AclTraffic.tcpPort(80),
    direction: direction,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`${entryNamePrefix}HTTPS`, {
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 120,
    networkAclEntryName: 'HTTPS',
    traffic: ec2.AclTraffic.tcpPort(443),
    direction: direction,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`${entryNamePrefix}Ephemeral`,{
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 130,
    networkAclEntryName: 'Ephemeral',
    traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
    direction: direction,
    ruleAction: ec2.Action.ALLOW
  });
 }

 private privateEgressNetworkAclEntry(nacl: ec2.INetworkAcl){
  nacl.addEntry(`EgressICMP`, {
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 100,
    networkAclEntryName: `ICMP`,
    traffic: ec2.AclTraffic.icmp({code: -1, type: -1}),
    direction: ec2.TrafficDirection.EGRESS,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`EgressHTTP`, {
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 110,
    networkAclEntryName: `HTTP`,
    traffic: ec2.AclTraffic.tcpPort(80),
    direction: ec2.TrafficDirection.EGRESS,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`EgressHTTPS`, {
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 120,
    networkAclEntryName: `HTTPS`,
    traffic: ec2.AclTraffic.tcpPort(443),
    direction: ec2.TrafficDirection.EGRESS,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`EgressEphemeral`,{
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 130,
    networkAclEntryName: `Ephemeral`,
    traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
    direction: ec2.TrafficDirection.EGRESS,
    ruleAction: ec2.Action.ALLOW
  });
  this.vpc.isolatedSubnets.forEach((protectedSubnet, index) => {
    nacl.addEntry(`EgressDatabase${index}`, {
      cidr: ec2.AclCidr.ipv4(protectedSubnet.ipv4CidrBlock),
      ruleNumber: 140 + index,
      networkAclEntryName: `Database${index}`,
      traffic: ec2.AclTraffic.tcpPort(3306),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW
    });
  });
}

 private privateIngressNetworkAclEntry(nacl: ec2.INetworkAcl, cidr: string) {
  nacl.addEntry(`IngressICMP`, {
    cidr: ec2.AclCidr.ipv4(cidr),
    ruleNumber: 100,
    networkAclEntryName: `ICMP`,
    traffic: ec2.AclTraffic.icmp({code: -1, type: -1}),
    direction: ec2.TrafficDirection.INGRESS,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`IngressHTTP`, {
    cidr: ec2.AclCidr.ipv4(cidr),
    ruleNumber: 110,
    networkAclEntryName: `HTTP`,
    traffic: ec2.AclTraffic.tcpPort(80),
    direction: ec2.TrafficDirection.INGRESS,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`IngressHTTPS`, {
    cidr: ec2.AclCidr.ipv4(cidr),
    ruleNumber: 120,
    networkAclEntryName: `HTTPS`,
    traffic: ec2.AclTraffic.tcpPort(443),
    direction: ec2.TrafficDirection.INGRESS,
    ruleAction: ec2.Action.ALLOW
  });
  nacl.addEntry(`IngressEphemeral`,{
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 130,
    networkAclEntryName: `Ephemeral`,
    traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
    direction: ec2.TrafficDirection.INGRESS,
    ruleAction: ec2.Action.ALLOW
  });
 }

 private protectedNetworkAclEntry(nacl: ec2.INetworkAcl, direction: ec2.TrafficDirection, vpc: ec2.IVpc) {
  const entryNamePrefix = direction === ec2.TrafficDirection.INGRESS ? "Ingress" : "Egress";

  // Cidrを動的に計算しにくいのでCidrをまとめず追加する
  vpc.privateSubnets.forEach((privateSubnet, index) => {
    nacl.addEntry(`${entryNamePrefix}Database${index}`, {
      cidr: ec2.AclCidr.ipv4(privateSubnet.ipv4CidrBlock),
      ruleNumber: 100 + index,
      networkAclEntryName: `Database${index}`,
      traffic: ec2.AclTraffic.tcpPort(3306),
      direction: direction,
      ruleAction: ec2.Action.ALLOW
    });
  });
  nacl.addEntry(`${entryNamePrefix}Ephemeral`,{
    cidr: ec2.AclCidr.anyIpv4(),
    ruleNumber: 110,
    networkAclEntryName: `${entryNamePrefix}Ephemeral`,
    traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
    direction: direction,
    ruleAction: ec2.Action.ALLOW
  });
 }
}