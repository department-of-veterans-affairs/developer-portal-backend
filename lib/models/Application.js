"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var REDIRECT_URL = 'https://dev-api.va.gov/oauth2/redirect/';
var LOGIN_URL = 'https://dev-api.va.gov/oauth2/redirect/';
var IDME_GROUP_ID = '00g1syt19eSr12rXz2p7';
var Application = /** @class */ (function () {
    function Application(_a, owner) {
        var name = _a.name, redirectURIs = _a.redirectURIs, _b = _a.responseTypes, responseTypes = _b === void 0 ? ['token', 'id_token', 'code'] : _b, _c = _a.grantTypes, grantTypes = _c === void 0 ? ['authorization_code', 'implicit', 'refresh_token'] : _c, options = __rest(_a, ["name", "redirectURIs", "responseTypes", "grantTypes"]);
        this.errors = [];
        this.owner = owner;
        this.settings = {
            name: 'oidc_client',
            label: name,
            signOnMode: 'OPENID_CONNECT',
            settings: {
                oauthClient: {
                    client_uri: options.clientURI,
                    logo_uri: options.logoURI,
                    redirect_uris: redirectURIs.concat([REDIRECT_URL]),
                    response_types: responseTypes,
                    grant_types: grantTypes,
                    application_type: 'web',
                    consent_method: 'REQUIRED',
                    initiate_login_uri: LOGIN_URL,
                },
            },
        };
    }
    Application.prototype.toOktaApp = function () {
        return this.settings;
    };
    Application.prototype.createOktaApplication = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var resp, _a, client_id, client_secret, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, client.createApplication(this, IDME_GROUP_ID)];
                    case 1:
                        resp = _b.sent();
                        _a = resp.credentials.oauthClient, client_id = _a.client_id, client_secret = _a.client_secret;
                        this.client_id = client_id;
                        this.client_secret = client_secret;
                        this.oktaID = resp.id;
                        return [2 /*return*/, resp];
                    case 2:
                        error_1 = _b.sent();
                        this.errors.push(error_1);
                        throw this;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return Application;
}());
exports.Application = Application;
