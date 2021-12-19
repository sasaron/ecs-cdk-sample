import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export class AssignSecurityGroup {
  private ecsSecurityGroup: ec2.ISecurityGroup;
  private rdsSecurityGroup: ec2.ISecurityGroup;
	constructor(ecsSecurityGroup: ec2.ISecurityGroup, rdsSecurityGroup: ec2.ISecurityGroup ) {
    this.ecsSecurityGroup = ecsSecurityGroup;
    this.rdsSecurityGroup = rdsSecurityGroup;
	}
  assign(){
    this.rdsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow ECS Connection'
    );
  }
}
