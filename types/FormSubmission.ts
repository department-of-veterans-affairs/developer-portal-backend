// A struct to define default values for submissions with omitted fields.
export class FormSubmission {
  public firstName = '';

  public lastName = '';

  public organization = '';

  public description = '';

  public email = '';

  public oAuthRedirectURI = '';

  public oAuthApplicationType = '';

  public programName = '';

  public sponsorEmail = '';

  public termsOfService = false;
  
  public vaEmail = '';

  public apis = ''; // Comma-separated list
}