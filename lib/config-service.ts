export class ConfigService {

  private type Environments = "Dev" | "Stage" | "Prod";
  public readonly environment: Environments;
  public data: Config;
  constructor(environment: Environments) {
    this.environment = environment;
  }

  public load(){
    let filename = this.environment.toLowerCase();
    this.data = require(`/config/${filename}.json`);
  }
}
