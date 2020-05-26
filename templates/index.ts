export const WELCOME_TEMPLATE = `<div>Welcome {{ firstName }},</div><br />

<div>Thank you for your interest in our {{ apis }}. We are excited to partner with you to improve the lives of veterans.</div><br />

{{# if token_issued}}
<div>Here's your key for accessing the development environment: <pre>{{ key }}</pre></div><br />

<div>You can use your key by including it as an HTTP request header <pre>apiKey: {{ key }}</pre> in your requests to the API. You can find additional documentation at <a href="https://developer.va.gov">developer.va.gov</a></div><br />
{{/if}}

{{#if oauth }}
<div>Here's your OAuth Client ID: <pre>{{ clientID }}</pre></div><br />

{{#if clientSecret}}
<div>Here's your OAuth Client Secret: <pre>{{ clientSecret }}</pre></div><br />
{{/if}}

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

export const SUPPORT_TEMPLATE = `<ul>
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