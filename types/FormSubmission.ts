import { DeveloperApplicationRequestBody } from '.';

// A struct to define default values for submissions with omitted fields.
export class FormSubmission {
  public apis; // Comma-separated list

  public description;

  public email;

  public firstName;

  public lastName;

  public organization;

  public oAuthRedirectURI;

  public oAuthApplicationType;

  public programName;

  public sponsorEmail;

  public termsOfService;

  public vaEmail;

  public constructor(body: DeveloperApplicationRequestBody) {
    this.apis = body.apis;
    this.description = body.description;
    this.email = body.email;
    this.firstName = body.firstName;
    this.lastName = body.lastName;
    this.organization = body.organization;
    this.oAuthRedirectURI = body.oAuthRedirectURI;
    this.oAuthApplicationType = body.oAuthApplicationType;
    this.programName = body.internalApiInfo?.programName ?? '';
    this.sponsorEmail = body.internalApiInfo?.sponsorEmail ?? '';
    this.termsOfService = body.termsOfService;
    this.vaEmail = body.internalApiInfo?.vaEmail ?? '';
  }
}
