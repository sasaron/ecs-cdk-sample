#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsSampleStack } from '../lib/ecs-sample-stack';
import { VPCSampleStack } from '../lib/vpc-sample-stack'; 
import { RDSSampleStack } from '../lib/rds-sample-stack';
import { AssignSecurityGroup } from '../lib/assign-security-group';

const app = new cdk.App();
const vpcStack = new VPCSampleStack(app, 'VPCSampleStack', {});
const rdsStack = new RDSSampleStack(app, 'RDSSampleStack',  vpcStack.vpc, {});
const ecsStack = new EcsSampleStack(app, 'EcsSampleStack', vpcStack.vpc, {});
new AssignSecurityGroup(ecsStack.ecsToRDSSecurityGroup, rdsStack.rdsSecurityGroup).assign();
