export const config: Config = {
  app: {
		name: "ECSSample",
    env: "Dev"
	},
  network: {
    cidr: "192.168.0.0/21",
    maxAzs: 2,
    public: {
      cidrMask: 24
    },
    private: {
      cidrMask: 24
    },
    protected: {
      cidrMask: 24
    }
  },
  ssm: {
    parameter: {
      prefix: "/${app.name}/${env}/"
    }
  },
  rds: {
    driver: "",
    version: "",
    instance: {
      type: "T4G",
      size: "MEDIUM"
    }
  }
};