export class SignUpDto {
  public constructor(
    readonly username: string,
    readonly password: string,
    readonly repeatPassword: string,
    readonly email: string
  ) {
    this.username = username;
    this.password = password;
    this.repeatPassword = repeatPassword;
    this.email = email;
  }
}
