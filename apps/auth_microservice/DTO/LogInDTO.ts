export class LogInDTO {
  public constructor(readonly login: string, readonly password: string) {
    this.login = login;
    this.password = password;
  }
}
