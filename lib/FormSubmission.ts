// A struct to define default values for submissions with omitted fields.
export class FormSubmission {
  public firstName: string = '';
  public lastName: string = '';
  public organization: string = '';
  public description: string = '';
  public email: string = '';
  public oAuthRedirectURI: string = '';
  public termsOfService: boolean = false;
  public apis: string = ''; // Comma-separated list
}
