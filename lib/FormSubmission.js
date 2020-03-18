"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// A struct to define default values for submissions with omitted fields.
var FormSubmission = /** @class */ (function () {
    function FormSubmission() {
        this.firstName = '';
        this.lastName = '';
        this.organization = '';
        this.description = '';
        this.email = '';
        this.oAuthRedirectURI = '';
        this.termsOfService = false;
        this.apis = ''; // Comma-separated list
    }
    return FormSubmission;
}());
exports.FormSubmission = FormSubmission;
