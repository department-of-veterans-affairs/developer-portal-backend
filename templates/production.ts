/* eslint-disable id-length, max-lines */

export const PRODUCTION_ACCESS_CONSUMER_TEMPLATE = `
<head>
  <style>
    .card {
      margin: 0 0 20px 0;
      background: #FFFFFF;
      Padding: 24px 24px 0.1px 24px;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 25px;
      max-width: 700px;
    }

    .header {
      background: #112E51;
      width: 100%;
      height: 80px;
    }

    .header img {
      margin-top: 30px;
      margin-left: 20px;
    }

    .steps {
      width: 24px;
      float:left;
      height: 26px;
      margin-right: 10px;
    }

    .sub {
      margin-left: 34px;
      margin-bottom: 10px;
      float:center;
    }

    h1 {
      margin-bottom: 20px;
      padding: 0;
      font-size: 24px;
      line-height: 30px;
      font-weight: bold;
      color: #323A45;
    }
    .steps-container {
      height: 26px;
      margin-bottom: 20px;
    }

    .step-heading {
      padding: 0;
      font-size: 16px;
      line-height: 25px;
      font-weight: bold;
      color: #323A45;
      display: inline;
    }

    ol {
      list-style: none;
      padding-left: 0;
    }

    p {
      margin-bottom: 20px;
      font-size: 16px;
      line-height: 25px;
      color: #323A45;
    }

    p a {
      text-decoration: underline;
    }
  </style>
</head>

<div class="card">
  <div class="header"><img src="https://dvp-developer-portal-backend-images.s3-us-gov-west-1.amazonaws.com/VA-Lighhouse-APIs-email.png" alt="VA Lighthouse APIs Logo"/></div>
  <p>We’ve received your request for production access. It’s good to remember that getting production access requires
    multiple steps and can take less than a week to over a month, depending on the API. For open data APIs,
    production access takes a week or less and no demo is required.</p>
  <h1><strong>What’s next?</strong></h1>
  <ol>
    <li class="steps-container">
      <img class="steps" src="https://dvp-developer-portal-backend-images.s3-us-gov-west-1.amazonaws.com/Done.png" alt="Step one, done"/>
      <div class="step-heading">
      <strong>
        Start developing.
      </strong>
      </div>
    </li>
    <li>
      <img class="steps" src="https://dvp-developer-portal-backend-images.s3-us-gov-west-1.amazonaws.com/Done.png" alt="Step two, done"/>
      <div class="step-heading">
        <strong>
          Submit your production access request.
        </strong>
      </div>
      <div class="sub">
        We’ll review your information and notify you within 1-2 weeks if there are any changes we need.
      </div>
    </li>
    <li>
      <img class="steps" src="https://dvp-developer-portal-backend-images.s3-us-gov-west-1.amazonaws.com/step-3-selected.png" alt="Step three, todo"/>
      <div class="step-heading">
          <a href="https://developer.va.gov/onboarding/prepare-for-and-complete-a-demo">
            <strong>
              Make any needed technical or policy changes, then complete a demo.
            </strong>
          </a>
      </div>
      <div class="sub">
        The faster you complete any changes, the faster we can schedule a demo. Once your changes are made, we aim to schedule the demo within a week. Demos generally last from 30 to 60 minutes.
      </div>
    </li>
    <li>
      <img class="steps" src="https://dvp-developer-portal-backend-images.s3-us-gov-west-1.amazonaws.com/step-4-disabled.png" alt="Step four"/>
      <div class="step-heading">
        <strong>
          Receive production access.
        </strong>
      </div>
      <div class="sub">
        After the demo is complete and any final items are wrapped up, production access is granted within a week.
      </div>
    </li>
  </ol>
  <p>
    Interested in getting access to another API? Read the API docs or request a new API key.
  </p>
  <p>
    <a href="https://developer.va.gov/onboarding/prepare-for-and-complete-a-demo">
      Preparing for a demo
    </a> |
    <a href="https://developer.va.gov/onboarding/working-with-lighthouse-apis">
      Working with Lighthouse APIs
    </a> |
    <a href="https://developer.va.gov/support/contact-us">
      Contact us
    </a>
  </p>
</div>
`;

export const PRODUCTION_ACCESS_SUPPORT_TEMPLATE = `<h2>Basic Information</h2>
<ul>
  <li>
    <div>
      <strong><div>Primary Contact:</div></strong>
      <div>First Name: {{primaryContact.firstName}}</div>
      <div>Last Name: {{primaryContact.lastName}}</div>
      <div>Email: {{primaryContact.email}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong><div>Secondary Contact:</div></strong>
      <div>First Name: {{secondaryContact.firstName}}</div>
      <div>Last Name: {{secondaryContact.lastName}}</div>
      <div>Email: {{secondaryContact.email}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong><div>Organization:</div></strong>
      <div>{{organization}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong><div>Application Name:</div></strong>
      <div>{{appName}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Application Description:</div>
      </strong>
      <div>{{appDescription}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Website:</div>
      </strong>
      <div>{{website}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Phone Number:</div>
      </strong>
      <div>{{phoneNumber}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Status Update Emails:</div>
      </strong>
      {{#each statusUpdateEmails}}
        <div>{{this}}</div>
      {{/each}}
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>APIs:</div>
      </strong>
      <div>{{apis}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Policy Documents:</div>
      </strong>
      {{#each policyDocuments}}
          <div>{{this}}</div>
      {{/each}}
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Value Provided:</div>
      </strong>
      <div>{{valueProvided}}</div>
    </div>
  </li>
  {{#if businessModel}}
    <li>
      <div>
        <strong>
          <div>Business Model:</div>
        </strong>
        <div>{{businessModel}}</div>
      </div>
    </li>
  {{/if}}
</ul>
<h2>Monetization Information</h2>
<ul>
  <li>
    <div>
      <strong>
        <div>Application Monitizes Veteran Information:</div>
      </strong>
      <div>{{monitizedVeteranInformation}}</div>
    </div>
  </li>
  {{#if monitizedVeteranInformation}}
    <li>
      <div>
        <strong>
          <div>Explanation:</div>
        </strong>
        <div>{{monitizationExplanation}}</div>
      </div>
    </li>
    <li>
      <div>
        <strong>
          <div>App is Veteran Facing:</div>
        </strong>
        <div>{{veteranFacing}}</div>
      </div>
    </li>
    {{#if veteranFacing}}
      <li>
        <div>
          <strong>
            <div>Link to Application's Primary Webpage:</div>
          </strong>
          <div>{{website}}</div>
        </div>
      </li>
      <li>
        <div>
          <strong>
            <div>Link to Application's Signup Page:</div>
          </strong>
          <div>{{signUpLink}}</div>
        </div>
      </li>
      <li>
        <div>
          <strong>
            <div>Link to Application's FAQ/Support Page:</div>
          </strong>
          <div>{{supportLink}}</div>
        </div>
      </li>
      <li>
        <div>
          <strong>
            <div>Available on the Following Platforms:</div>
          </strong>
          <div>{{platforms}}</div>
        </div>
      </li>
      <li>
        <div>
          <strong>
            <div>Veteran Facing Description:</div>
          </strong>
          <div>{{veteranFacingDescription}}</div>
        </div>
      </li>
    {{/if}}
  {{/if}}
</ul>
<h2>Technical Information</h2>
<ul>
  <li>
    <div>
      <strong>
        <div>VASI System Name</div>
      </strong>
      <div>{{vasiSystemName}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Credential Storage:</div>
      </strong>
      <div>{{credentialStorage}}</div>
    </div>
  </li>
  <li>
    <div>
      <strong>
        <div>Application Stores PII/PHI:</div>
      </strong>
      <div>{{storePIIOrPHI}}</div>
    </div>
  </li>
  {{#if storePIIOrPHI}}
    <li>
      <div>
        <strong>
          <div>How is PII/PHI Stored?:</div>
        </strong>
        <div>{{piiStorageMethod}}</div>
      </div>
    </li>
    <li>
      <div>
        <strong>
          <div>Safeguards in Place:</div>
        </strong>
        <div>{{multipleReqSafeguards}}</div>
      </div>
    </li>
    <li>
      <div>
        <strong>
          <div>Breach Management Process:</div>
        </strong>
        <div>{{breachManagementProcess}}</div>
      </div>
    </li>
    <li>
      <div>
        <strong>
          <div>Vulnerability Management and Patch Process:</div>
        </strong>
        <div>{{vulnerabilityManagement}}</div>
      </div>
    </li>
    <li>
      <div>
        <strong>
          <div>Application Exposes Veterans’ Health, Claims, Disabilities, or Service History Data to Third Parties:</div>
        </strong>
        <div>{{exposeVeteranInformationToThirdParties}}</div>
      </div>
    </li>
    {{#if exposeVeteranInformationToThirdParties}}
      <li>
        <div>
          <strong>
            <div>Description:</div>
          </strong>
          <div>{{thirdPartyInfoDescription}}</div>
        </div>
      </li>
      <li>
        <div>
          <strong>
            <div>Scopes Access Requested:</div>
          </strong>
          <div>{{scopesAccessRequested}}</div>
        </div>
      </li>
    {{/if}}
      <li>
        <div>
          <strong>
            <div>Distributing Production API Keys to Customers:</div>
          </strong>
          <div>{{distributingAPIKeysToCustomers}}</div>
        </div>
      </li>
      {{#if distributingAPIKeysToCustomers}}
        <li>
          <div>
            <strong>
              <div>Naming Convention for Customers:</div>
            </strong>
            <div>namingConvention</div>
          </div>
        </li>
        <li>
          <div>
            <strong>
              <div>Centralized Backend Log of Customer Submissions</div>
            </strong>
            <div>{{centralizedBackendLog}}</div>
          </div>
        </li>
      {{/if}}
    {{/if}}
  <li>
    <div>
      <strong>
        <div>Listed on MyHealthApplication.com:</div>
      </strong>
      <div>{{listedOnMyHealthApplication}}</div>
    </div>
  </li>
</ul>
`;
