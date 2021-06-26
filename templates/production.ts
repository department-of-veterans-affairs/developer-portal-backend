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
    <strong>
      <div>Application Monitizes Veteran Information:</div>
    </strong>
    <div>{{monitizedVeteranInformation}}</div>
  </li>
  {{#if monitizedVeteranInformation}}
    <li>
      <strong>
        <div>Explanation:</div>
      </strong>
      <div>{{monitizationExplanation}}</div>
    </li>
    <li>
      <strong>
        <div>App is Veteran Facing:</div>
      </strong>
      <div>{{veteranFacing}}</div>
    </li>
    {{#if veteranFacing}}
      <li>
        <strong>
          <div>Link to Application's Primary Webpage:</div>
        </strong>
        <div>{{website}}</div>
      </li>
      <li>
        <strong>
          <div>Link to Application's Signup Page:</div>
        </strong>
        <div>{{signUpLink}}</div>
      </li>
      <li>
        <strong>
          <div>Link to Application's FAQ/Support Page:</div>
        </strong>
        <div>{{supportLink}}</div>
      </li>
      <li>
        <strong>
          <div>Available on the Following Platforms:</div>
        </strong>
        <div>{{platforms}}</div>
      </li>
      <li>
        <strong>
          <div>Veteran Facing Description:</div>
        </strong>
        <div>{{veteranFacingDescription}}</div>
      </li>
    {{/if}}
  {{/if}}
</ul>
<h2>Technical Information</h2>
<ul>
  <li>
    <strong>
      <div>VASI System Name</div>
    </strong>
    <div>{{vasiSystemName}}</div>
  </li>
  <li>
    <strong>
      <div>Credential Storage:</div>
    </strong>
    <div>{{credentialStorage}}</div>
  </li>
  <li>
    <strong>
      <div>Application Stores PII/PHI:</div>
    </strong>
    <div>{{storePIIOrPHI}}</div>
  </li>
  {{#if storePIIOrPHI}}
    <li>
      <strong>
        <div>How is PII/PHI Stored?:</div>
      </strong>
      <div>{{storageMethod}}</div>
    </li>
    <li>
      <strong>
        <div>Safeguards in Place:</div>
      </strong>
      <div>{{safeguards}}</div>
    </li>
    <li>
      <strong>
        <div>Breach Management Process:</div>
      </strong>
      <div>{{breachManagementProcess}}</div>
    </li>
    <li>
      <strong>
        <div>Vulnerability Management and Patch Process:</div>
      </strong>
      <div>{{vulnerabilityManagement}}</div>
    </li>
    <li>
      <strong>
        <div>Application Exposes Veterans’ Health, Claims, Disabilities, or Service History Data to Third Parties:</div>
      </strong>
      <div>{{exposeHealthInformationToThirdParties}}</div>
    </li>
    {{#if exposeHealthInformationToThirdParties}}
      <li>
        <strong>
          <div>Description:</div>
        </strong>
        <div>{{thirdPartyHealthInfoDescription}}</div>
      </li>
      <li>
        <strong>
          <div>Scopes Access Requested:</div>
        </strong>
        <div>{{scopesAccessRequested}}</div>
      </li>
    {{/if}}
      <li>
        <strong>
          <div>Distrubiting Production API Keys to Customers:</div>
        </strong>
        <div>{{distrubitingAPIKeysToCustomers}}</div>
      </li>
      {{#if distrubitingAPIKeysToCustomers}}
        <li>
          <strong>
            <div>Naming Convention for Customers:</div>
          </strong>
          <div>namingConvention</div>
        </li>
        <li>
          <strong>
            <div>Centralized Backend Log of Customer Submissions</div>
          </strong>
          <div>{{centralizedBackendLog}}</div>
        </li>
      {{/if}}
    {{/if}}
  <li>
    <strong>
      <div>Listed on MyHealthApplication.com:</div>
    </strong>
    <div>{{listedOnMyHealthApplication}}</div>
  </li>
</ul>`;
