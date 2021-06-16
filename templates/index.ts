export const WELCOME_TEMPLATE = `<div>Welcome {{ firstName }},</div><br />

<div>Thank you for your interest in our {{ apis }}. We are excited to partner with you to improve the lives of veterans.</div><br />

{{# if token_issued}}
<div>Here's your key for accessing the development environment: <pre>{{ key }}</pre></div><br />

<div>Your client username is: <pre>{{ kongUsername }}</pre> Please reference this in any support request.</div><br />

<div>You can use your key by including it as an HTTP request header <pre>apiKey: {{ key }}</pre> in your requests to the API. You can find additional documentation at <a href="https://developer.va.gov">developer.va.gov</a></div><br />
{{/if}}

{{#if oauth }}
<div>Here's your OAuth Client ID: <pre>{{ clientID }}</pre></div><br />

{{! pkce auth flow wont have a client secret }}
{{#if clientSecret}}
<div>Here's your OAuth Client Secret: <pre>{{ clientSecret }}</pre></div><br />
{{/if}}

<div>Your redirect URI is: <pre>{{ redirectURI }}</pre></div><br />

<div>Please visit our OAuth documentation for implementation guidelines: <a href="https://developer.va.gov/oauth">developer.va.gov/oauth</a></div><br />
{{/if}}

<div>If you find a bug or would like to make a feature request, please open an issue through our Support page. We are continually working to improve our process and welcome <a href="https://developer.va.gov/support">feedback along your journey</a>.</div><br />

<div>When you're ready to move to a production environment, please follow the steps outlined on our <a href="https://developer.va.gov/go-live">Path to Production</a> page.</div><br />

<div>Thank you again,</div>
<div>VA API Platform Team</div> <br />
<div><strong>Read VA API Docs at: </strong><a href="https://developer.va.gov">developer.va.gov</a></div>
<div><strong>Get support: </strong><a href="https://github.com/department-of-veterans-affairs/vets-api-clients/issues/new/choose">Create Github Issue</a></div>
<div><strong>Email us at: </strong><a href="mailto:api@va.gov">api@va.gov</a></div>
`;

export const CONSUMER_SUPPORT_TEMPLATE = `<ul>
    <li>
        <div>
            <div>First Name:</div>
            <div>{{firstName}}</div>
        </div>
    </li>
    <li>
        <div>
            <div>Last Name:</div>
            <div>{{lastName}}</div>
        </div>
    </li>
    <li>
        <div>
            <div>Organization:</div>
            <div>{{organization}}</div>
        </div>
    </li>
    <li>
        <div>
            <div>From Email:</div>
            <div>{{requester}}</div>
        </div>
    </li>
    <li>
        <div>
            <div>Description:</div>
            <div>{{description}}</div>
        </div>
    </li>
    <li>
        <div>
            <div>APIs:</div>
            <div>{{apis}}</div>
        </div>
    </li>
</ul>`;
export const PRODUCTION_ACCESS_CONSUMER_TEMPLATE = `
<p>We’ve received your request for production access. It’s good to remember that getting production access requires
	multiple steps and can take less than a week to over a month, depending on the API. For open data APIs,
	production access takes a week or less and no demo is required.</p>
<p><strong>What’s next?</strong></p>
<p style="margin-left: 20px"><strong style="color: green">✓</strong><strong> Start developing. </strong></p>
<p style="margin-left: 20px"><strong style="color: green">✓</strong><strong> Submit your production access request.
	</strong></p>
<p style="margin-left: 40px">We’ll review your information and notify you within 1-2 weeks if there are any changes we
	need. </p>
<a href="https://developer.va.gov/onboarding/prepare-for-and-complete-a-demo">
	<p style="margin-left: 20px"><strong>3.</strong><strong> </strong><strong>Make any needed technical or policy changes, then complete a demo.</strong><strong> </strong></p>
</a>
<p style="margin-left: 40px">The faster you complete any changes, the faster we can schedule a demo. Once your changes
	are made, we aim to
	schedule the demo within a week. Demos generally last from 30 to 60 minutes. </p>
<p style="margin-left: 20px"><strong>4.</strong><strong> </strong><strong>Receive production access. </strong></p>
<p style="margin-left: 40px">After the demo is complete and any final items are wrapped up, production access is granted
	within a week. </p>
<center>
	<p>Interested in getting access to another API? Read the API docs or request a new API key. </p>
</center>

<center>
	<p><a href="https://developer.va.gov/onboarding/prepare-for-and-complete-a-demo"><u>Preparing for a demo</u></a> | <a href="https://developer.va.gov/onboarding/working-with-lighthouse-apis"><u>Working with
				Lighthouse APIs</u></a> | <a
			href="https://developer.va.gov/support/contact-us"><u>Contact us</u></a></p>
</center>
`;
export const PRODUCTION_ACCESS_SUPPORT_TEMPLATE = `<ul>
<li>
    <div>
        <div>Primary Contact:</div>
        <div>First Name: {{primaryFirstName}}</div>
        <div>Last Name: {{primaryLastName}}</div>
        <div>Email: {{primaryEmail}}</div>
    </div>
</li>
<li>
    <div>
        <div>Secondary Contact:</div>
        <div>First Name: {{secondaryFirstName}}</div>
        <div>Last Name: {{secondaryLastName}}</div>
        <div>Email: {{secondaryEmail}}</div>
    </div>
</li>
<li>
    <div>
        <div>Organization:</div>
        <div>{{organization}}</div>
    </div>
</li>
<li>
    <div>
        <div>Application Name:</div>
        <div>{{appName}}</div>
    </div>
    <div>
        <div>Application Description:</div>
        <div>{{appDescription}}</div>
    </div>
</li>
<li>
    <div>Terms of Service:</div>
    <div>{{termsOfService}}</div>
</li>
<li>
    <div>
        <div>From Email:</div>
        <div>{{requester}}</div>
    </div>
</li>
<li>
    <div>
        <div>Website:</div>
        <div>{{website}}</div>
    </div>
</li>
<li>
    <div>
        <div>Phone Number:</div>
        <div>{{phoneNumber}}</div>
    </div>
</li>
<li>
    <div>
        <div>Status Update Emails:</div>
        {{#each statusUpdateEmails}}
        <div>{{this}}</div>
        {{/each}}
    </div>
</li>
<li>
    <div>
        <div>APIs:</div>
        {{#each apis}}
        <div>{{this}}</div>
        {{/each}}
    </div>
</li>
<li>
    <div>
        <div>Policy Documents:</div>
        {{#each policyDocuments}}
            <div>{{this}}</div>
        {{/each}}
    </div>
</li>
<li>
    <div>
        <div>Value Provided:</div>
        <div>{{valueProvided}}</div>
    </div>
</li>
{{#if businessModel}}
  <li>
      <div>
          <div>Business Model:</div>
          <div>{{businessModel}}</div>
      </div>
  </li>
{{/if}}
<li>
    <div>Monitization Information:</div>
    {{#with monitization}}
    <div>Application Monitizes Veteran Information:</div>
    <div>{{monitizedVeteranInformation}}</div>
    {{#if monitizedVeteranInformation}}
        <div>Explanation:</div>
        <div>{{monitizationExplanation}}</div>
        <div>App is Veteran Facing:</div>
        <div>{{veteranFacing}}</div>
        {{#if veteranFacing}}
            <div>Link to Application's Primary Webpage:</div>
            <div>{{website}}</div>
            <div>Link to Application's Signup Page:</div>
            <div>{{signUpLink}}</div>
            <div>Link to Application's FAQ/Support Page:</div>
            <div>{{supportLink}}</div>
            <div>Available on the Following Platforms:</div>
            <div>{{platforms}}</div>
            <div>Veteran Facing Description:</div>
            <div>{{veteranFacingDescription}}</div>
        {{/if}}
    {{/if}}
    {{/with}}
</li>
<li>
    <div>Technical Information</div>
    {{#with technicalInformation}}
    <div>VASI System Name</div>
    <div>{{vasiSystemName}}</div>
    <div>Credential Storage:</div>
    <div>{{credentialStorage}}</div>
    <div>Application Stores PII/PHI:</div>
    <div>{{storePIIOrPHI}}</div>
    {{#if storePIIOrPHI}}
        <div>How is PII/PHI Stored?:</div>
        <div>{{storageMethod}}</div>
        <div>Safeguards in Place:</div>
        <div>{{safeguards}}</div>
        <div>Breach Management Process:</div>
        <div>{{breachManagementProcess}}</div>
        <div>Vulnerability Management and Patch Process:</div>
        <div>{{vulnerabilityManagement}}</div>
        <div>Application Exposes Veterans’ Health, Claims, Disabilities, or Service History Data to Third Parties:</div>
        <div>{{exposeHealthInformationToThirdParties}}</div>
        {{#if exposeHealthInformationToThirdParties}}
            <div>Description:</div>
            <div>{{thirdPartyHealthInfoDescription}}</div>
            <div>Scopes Access Requested:</div>
            <div>{{scopesAccessRequested}}</div>
        {{/if}}
        <div>Distrubiting Production API Keys to Customers:</div>
        <div>{{distrubitingAPIKeysToCustomers}}</div>
        {{#if distrubitingAPIKeysToCustomers}}
            <div>Naming Convention for Customers:</div>
            <div>namingConvention</div>
            <div>Centralized Backend Log of Customer Submissions</div>
            <div>{{centralizedBackendLog}}</div>
        {{/if}}
    {{/if}}
    {{/with}}
</li>
</ul> `;

export const PUBLISHING_SUPPORT_TEMPLATE = `<ul>
<li>
    <div>
        <div>First Name:</div>
        <div>{{firstName}}</div>
    </div>
</li>
<li>
    <div>
        <div>Last Name:</div>
        <div>{{lastName}}</div>
    </div>
</li>
<li>
    <div>
        <div>Organization:</div>
        <div>{{organization}}</div>
    </div>
</li>
<li>
    <div>
        <div>From Email:</div>
        <div>{{requester}}</div>
    </div>
</li>
<li>
    <div>
        <div>API Details:</div>
        <div>{{apiDetails}}</div>
    </div>
</li>
<li>
    <div>
        <div>API Description:</div>
        <div>{{apiDescription}}</div>
    </div>
</li>
<li>
    <div>
        <div>Internal Only:</div>
        <div>{{apiInternalOnly}}</div>
    </div>
</li>
<li>
    <div>
        <div>Internal Only Details:</div>
        <div>{{apiInternalOnlyDetails}}</div>
    </div>
</li>
<li>
    <div>
        <div>Other Info:</div>
        <div>{{apiOtherInfo}}</div>
    </div>
</li>
</ul>`;
