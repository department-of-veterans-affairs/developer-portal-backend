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
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_pick_1 = __importDefault(require("lodash.pick"));
var process_1 = __importDefault(require("process"));
var Application_1 = require("./Application");
var KONG_CONSUMER_APIS = ['benefits', 'facilities', 'vaForms', 'confirmation'];
var OKTA_CONSUMER_APIS = [
    'health',
    'verification',
    'communityCare',
    'claims',
];
var User = /** @class */ (function () {
    function User(_a) {
        var firstName = _a.firstName, lastName = _a.lastName, organization = _a.organization, email = _a.email, apis = _a.apis, description = _a.description, oAuthRedirectURI = _a.oAuthRedirectURI, termsOfService = _a.termsOfService;
        this.tableName = process_1.default.env.DYNAMODB_TABLE || 'Users';
        this.createdAt = new Date();
        this.firstName = firstName;
        this.lastName = lastName;
        this.organization = organization;
        this.email = email;
        this.apis = apis;
        this.description = description;
        this.oAuthRedirectURI = oAuthRedirectURI;
        this.errors = [];
        this.tosAccepted = termsOfService;
    }
    User.prototype.consumerName = function () {
        return ("" + this.organization + this.lastName).replace(/\W/g, '');
    };
    User.prototype.toSlackString = function () {
        var intro = this.lastName + ", " + this.firstName + ": " + this.email + "\nRequested access to:\n";
        return this.apiList.reduce(function (m, api) { return m.concat("* " + api + "\n"); }, intro);
    };
    Object.defineProperty(User.prototype, "apiList", {
        get: function () {
            return this._apiList;
        },
        enumerable: true,
        configurable: true
    });
    User.prototype.saveToKong = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var consumer, keyAuth, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, client.createConsumer(this)];
                    case 1:
                        consumer = _a.sent();
                        this.kongConsumerId = consumer.id;
                        return [4 /*yield*/, client.createACLs(this)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, client.createKeyAuth(this)];
                    case 3:
                        keyAuth = _a.sent();
                        this.token = keyAuth.key;
                        return [2 /*return*/, this];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Failed to create Kong Consumer');
                        this.errors.push(error_1);
                        throw this;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    User.prototype.sendEmail = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, client.sendWelcomeEmail(this)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Failed to send Welcome Email: ' + error_2.message);
                        this.errors.push(error_2);
                        throw this;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    User.prototype.sendSlackSuccess = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, client.sendSuccessMessage(this.toSlackString(), 'New User Application')];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        this.errors.push(error_3);
                        throw this;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    User.prototype.sendSlackFailure = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, client.sendFailureMessage(this.toSlackString(), 'User signup failed')];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        this.errors.push(error_4);
                        throw this;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    User.prototype.saveToDynamo = function (client) {
        var _this = this;
        var dynamoItem = lodash_pick_1.default(this, [
            'apis',
            'email',
            'firstName',
            'lastName',
            'organization',
            'oAuthRedirectURI',
            'kongConsumerId',
            'tosAccepted',
        ]);
        dynamoItem.description =
            this.description === '' ? 'no description' : this.description;
        dynamoItem.createdAt = this.createdAt.toISOString();
        if (this.oauthApplication && this.oauthApplication.oktaID) {
            dynamoItem.okta_application_id = this.oauthApplication.oktaID;
            dynamoItem.okta_client_id = this.oauthApplication.client_id;
        }
        Object.keys(dynamoItem).forEach(function (k) {
            if (dynamoItem[k] === '') {
                console.debug("Converting " + k + " from empty string to null");
                dynamoItem[k] = null;
            }
        });
        return new Promise(function (resolve, reject) {
            var params = {
                Item: dynamoItem,
                TableName: _this.tableName,
            };
            client.put(params, function (err, data) {
                if (err) {
                    _this.addError(err);
                    reject(_this);
                }
                resolve(_this);
            });
        });
    };
    User.prototype.saveToOkta = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!(this.oAuthRedirectURI !== '')) return [3 /*break*/, 2];
                        this.oauthApplication = new Application_1.Application({
                            // Save with the consumerName + current date in ISO format to avoid name clashes
                            // Without accounts there isn't a good way to look up and avoid creating applications
                            // with the same name which isn't allowed by Okta
                            name: this.consumerName() + "-" + this.createdAt.toISOString(),
                            redirectURIs: [this.oAuthRedirectURI],
                        }, this);
                        if (!this.oauthApplication) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.oauthApplication.createOktaApplication(client)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                    case 3:
                        err_1 = _a.sent();
                        console.error(err_1);
                        this.errors.push(err_1);
                        return [2 /*return*/, this];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    User.prototype.shouldUpdateKong = function () {
        var _this = this;
        var isKongApi = function (api) { return _this.apiList.indexOf(api) > -1; };
        return KONG_CONSUMER_APIS.filter(isKongApi).length > 0;
    };
    User.prototype.shouldUpdateOkta = function () {
        var _this = this;
        var isOktaApi = function (api) { return _this.apiList.indexOf(api) > -1; };
        return OKTA_CONSUMER_APIS.filter(isOktaApi).length > 0;
    };
    Object.defineProperty(User.prototype, "_apiList", {
        get: function () {
            if (this.apis) {
                return this.apis.split(',');
            }
            return [];
        },
        enumerable: true,
        configurable: true
    });
    User.prototype.addError = function (error) {
        this.errors.push(error);
    };
    return User;
}());
exports.User = User;
