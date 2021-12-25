#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ECSStack } from '../lib/ECSStack';
import { VPCStack } from '../lib/VPCStack'; 
import { RDSStack } from '../lib/RDSStack';
import { AssignSecurityGroup } from '../lib/AssignSecurityGroup';

const app = new cdk.App();
const vpcStack = new VPCStack(app, 'VPCSampleStack', {});
const rdsStack = new RDSStack(app, 'RDSSampleStack',  vpcStack.vpc, {});
const ecsStack = new ECSStack(app, 'EcsSampleStack', vpcStack.vpc, {});
new AssignSecurityGroup(ecsStack.ecsToRDSSecurityGroup, rdsStack.rdsSecurityGroup).assign();
