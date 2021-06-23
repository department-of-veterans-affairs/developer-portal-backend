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
</li>
<li>
    <div>Technical Information</div>
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
    <div>Listed on MyHealthApplication.com:</div>
    <div>{{listedOnMyHealthApplication}}</div>
</li>
</ul> `;

