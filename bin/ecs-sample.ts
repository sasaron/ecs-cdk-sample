#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ECSStack } from '../lib/ecsStack';
import { VPCStack } from '../lib/vpcStack';
import { RDSStack } from '../lib/rdsStack';
import { AssignSecurityGroup } from '../lib/assignSecurityGroup';
import config from 'config';

const app = new cdk.App();
const prefix = `${config.get("app.env")}${config.get("app.name")}`;

const vpcStack = new VPCStack(app, `${prefix}VPCStack`, {
	config: config,
	prefix: prefix
});
const rdsStack = new RDSStack(app, `${prefix}RDSStack`, {
	vpc: vpcStack.vpc,
	config: config,
	prefix: prefix
});
const ecsStack = new ECSStack(app, `${prefix}ECSStack`, {
	vpc: vpcStack.vpc,
	config: config,
	prefix: prefix
});
new AssignSecurityGroup(ecsStack.ecsToRDSSecurityGroup, rdsStack.rdsSecurityGroup).assign();
