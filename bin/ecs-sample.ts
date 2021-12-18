#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsSampleStack } from '../lib/ecs-sample-stack';
import { VPCSampleStack } from '../lib/vpc-sample-stack'; 

const app = new cdk.App();
const envDef = [
  'Dev',
  'Prod',
  'Stage',
];
let env : string;
if(process.env.ENV && envDef.indexOf(process.env.ENV)) {
  env = process.env.ENV;
} else {
  env = envDef[0];
}

const vpcStack = new VPCSampleStack(app, `${env}VPCSampleStack`, env, {});
new EcsSampleStack(app, `${env}EcsSampleStack`, vpcStack.vpc, env, {});