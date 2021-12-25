interface CidrMask {
  cidrMask: number
}
interface ParameterStore {
  prefix: string
}
interface Instance {
  type: string,
  size: string,
}
interface AppConfig {
  name: string,
  env: string,
}
interface NetWorkConfig {
  cidr: string,
  maxAzs: number,
  public: CidrMask, 
  private: CidrMask,
  protected: CidrMask
}
interface SSMConfig {
  parameter: ParameterStore
}
interface RdsConfig {
  driver: string,
  version: string,
  instance: Instance
}

declare interface Config {
  app: AppConfig,
  network: NetWorkConfig,
  ssm: SSMConfig,
  rds: RdsConfig
}