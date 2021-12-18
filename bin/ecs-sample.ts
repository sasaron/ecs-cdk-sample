#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsSampleStack } from '../lib/ecs-sample-stack';
import { VPCSampleStack } from '../lib/vpc-sample-stack'; 

const app = new cdk.App();
new EcsSampleStack(app, 'EcsSampleStack', {});
new VPCSampleStack(app, 'VPCSampleStack', {});