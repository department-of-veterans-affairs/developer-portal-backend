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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var Handlebars = __importStar(require("handlebars"));
var request = __importStar(require("request-promise-native"));
var url_1 = require("url");
var config_1 = require("./config");
var EMAIL_SUBJECT = 'Welcome to the VA API Platform';
var DUMP_SUBJECT = 'Daily User Registrations on Developer Portal';
var GovDeliveryClient = /** @class */ (function () {
    function GovDeliveryClient(_a) {
        var token = _a.token, host = _a.host;
        this.protocol = 'https';
        this.authToken = token;
        this.host = host;
        this.welcomeTemplate = new Promise(function (resolve, reject) {
            fs_1.default.readFile(__dirname + "/emails/welcomeEmail.html.hbs", 'utf-8', function (err, source) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(Handlebars.compile(source));
                }
            });
        });
    }
    GovDeliveryClient.prototype.sendDumpEmail = function (csvDump, sendTo) {
        return __awaiter(this, void 0, void 0, function () {
            var email;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        email = {
                            subject: DUMP_SUBJECT,
                            from_name: 'VA API Platform team',
                            body: csvDump,
                            recipients: sendTo.map(function (email) { return ({ email: email }); }),
                        };
                        return [4 /*yield*/, request.post(this.requestOptions('/messages/email', email))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GovDeliveryClient.prototype.sendWelcomeEmail = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var template, email;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(user.token || (user.oauthApplication && user.oauthApplication.client_id))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.welcomeTemplate];
                    case 1:
                        template = _a.sent();
                        email = {
                            subject: EMAIL_SUBJECT,
                            from_name: 'VA API Platform team',
                            body: template({
                                apis: this.listApis(user),
                                clientID: user.oauthApplication ? user.oauthApplication.client_id : '',
                                clientSecret: user.oauthApplication ? user.oauthApplication.client_secret : '',
                                firstName: user.firstName,
                                oauth: !!user.oauthApplication,
                                key: user.token,
                                token_issued: !!user.token,
                            }),
                            recipients: [{
                                    email: user.email,
                                }],
                        };
                        return [4 /*yield*/, request.post(this.requestOptions('/messages/email', email))];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: throw Error('User must have token or client_id initialized');
                }
            });
        });
    };
    GovDeliveryClient.prototype.listApis = function (user) {
        var apis = user.apiList;
        return apis.reduce(function (apiList, api, idx) {
            var properName = config_1.apisToProperNames[api];
            if (idx === 0) {
                return properName;
            }
            else if (idx === apis.length - 1 && apis.length === 2) {
                return apiList + " and " + properName;
            }
            else if (idx === apis.length - 1 && apis.length > 2) {
                return apiList + ", and " + properName;
            }
            return apiList + ", " + properName;
        }, '');
    };
    GovDeliveryClient.prototype.requestOptions = function (path, body) {
        var url = url_1.format({
            protocol: this.protocol,
            hostname: this.host,
            pathname: path,
        });
        var headers = {
            'X-AUTH-TOKEN': this.authToken,
        };
        return { body: body, url: url, headers: headers, json: true };
    };
    return GovDeliveryClient;
}());
exports.GovDeliveryClient = GovDeliveryClient;
