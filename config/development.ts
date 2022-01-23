import {
  aws_rds as rds,
  aws_ec2 as ec2,
} from 'aws-cdk-lib';

export = {
  "app": {
		"name": "ECSSample",
    "env": "Development"
	},
  "network": {
    "cidr": "192.168.0.0/21",
    "maxAzs": 2,
    "public": {
      "cidrMask": 24
    },
    "private": {
      "cidrMask": 24
    },
    "protected": {
      "cidrMask": 24
    }
  },
  "rds": {
    "version": rds.AuroraMysqlEngineVersion.VER_3_01_0,
    "instance": {
      "type": ec2.InstanceClass.T4G,
      "size": ec2.InstanceSize.MEDIUM
    }
  },
  "ecs": {
    "memory": 512,
    "cpu": 256,
    "desiredCount": 1,
    "minCapacity": 1,
    "maxCapacity": 3,
    "CPUScaling": 50,
    "MemoryScaling": 50,
    "application": {
      "image": "rds-connect-test"
    }
  }
}