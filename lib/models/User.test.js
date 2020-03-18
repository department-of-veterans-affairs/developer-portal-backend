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
Object.defineProperty(exports, "__esModule", { value: true });
var aws_sdk_1 = require("aws-sdk");
require("jest");
var FormSubmission_1 = require("../FormSubmission");
var User_1 = require("./User");
describe('User', function () {
    var event;
    var user;
    beforeEach(function () {
        event = {
            apis: 'facilities,verification',
            description: 'Mayhem',
            email: 'ed@adhocteam.us',
            firstName: 'Edward',
            lastName: 'Paget',
            organization: 'Ad Hoc',
            termsOfService: true,
        };
        user = new User_1.User(event);
    });
    describe('constructor', function () {
        test('it should assign fields from the event object', function () {
            expect(user.firstName).toEqual('Edward');
            expect(user.lastName).toEqual('Paget');
            expect(user.apis).toEqual('facilities,verification');
            expect(user.description).toEqual('Mayhem');
            expect(user.email).toEqual('ed@adhocteam.us');
            expect(user.organization).toEqual('Ad Hoc');
        });
        test('it should have a createdAt date', function () {
            expect(user.createdAt).not.toBe(null);
        });
        test('it should have an error Array', function () {
            expect(user.errors).not.toBe(null);
        });
        xtest('it should raise error if termsOfService is false', function () {
            event.termsOfService = false;
            expect(function () { return new User_1.User(event); }).toThrow();
        });
    });
    describe('shouldUpdateOkta', function () {
        var OKTA_CONSUMER_APIS = [
            'health',
            'verification',
            'communityCare',
            'claims',
        ];
        var _loop_1 = function (api) {
            it("should be true when " + api + " is requested", function () {
                event = {
                    apis: api,
                    description: 'Mayhem',
                    email: 'ed@adhocteam.us',
                    firstName: 'Edward',
                    lastName: 'Paget',
                    organization: 'Ad Hoc',
                    termsOfService: true,
                };
                user = new User_1.User(event);
                expect(user.shouldUpdateOkta()).toBe(true);
            });
        };
        for (var _i = 0, OKTA_CONSUMER_APIS_1 = OKTA_CONSUMER_APIS; _i < OKTA_CONSUMER_APIS_1.length; _i++) {
            var api = OKTA_CONSUMER_APIS_1[_i];
            _loop_1(api);
        }
        it('should be false when benefits / facilities are requested', function () {
            event = {
                apis: 'benefits,facilities',
                description: 'Mayhem',
                email: 'ed@adhocteam.us',
                firstName: 'Edward',
                lastName: 'Paget',
                organization: 'Ad Hoc',
                termsOfService: true,
            };
            user = new User_1.User(event);
            expect(user.shouldUpdateOkta()).toBe(false);
        });
    });
    describe('shouldUpdateKong', function () {
        it('should be true when facilities are requested', function () {
            expect(user.shouldUpdateKong()).toBe(true);
        });
        it('should be true when benefits are requested', function () {
            event = {
                apis: 'benefits,verification',
                description: 'Mayhem',
                email: 'ed@adhocteam.us',
                firstName: 'Edward',
                lastName: 'Paget',
                organization: 'Ad Hoc',
                termsOfService: true,
            };
            user = new User_1.User(event);
            expect(user.shouldUpdateKong()).toBe(true);
        });
        it('should be false otherwise', function () {
            event = {
                apis: 'verification,health,claims,communityCare',
                description: 'Mayhem',
                email: 'ed@adhocteam.us',
                firstName: 'Edward',
                lastName: 'Paget',
                organization: 'Ad Hoc',
                termsOfService: true,
            };
            user = new User_1.User(event);
            expect(user.shouldUpdateKong()).toBe(false);
        });
    });
    describe('consumerName', function () {
        test('it should return the org/lastname concated together', function () {
            user.createdAt = new Date(2018, 0, 23);
            expect(user.consumerName()).toEqual('AdHocPaget');
        });
    });
    describe('saveToDynamo', function () {
        test('it should use dynamo put to save items', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client, userResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = new aws_sdk_1.DynamoDB.DocumentClient();
                        client.put = jest.fn(function (params, cb) {
                            cb(null, params);
                        });
                        return [4 /*yield*/, user.saveToDynamo(client)];
                    case 1:
                        userResult = _a.sent();
                        expect(userResult).toEqual(user);
                        return [2 /*return*/];
                }
            });
        }); });
        test('it should add errors to user if save fails', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client, error, userResult_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = new aws_sdk_1.DynamoDB.DocumentClient();
                        error = {
                            code: 'error',
                            message: 'error',
                            retryable: false,
                            statusCode: 234,
                            time: new Date().toISOString(),
                            hostname: '',
                            region: 'us-west-1',
                            retryDelay: 102,
                            requestId: 'id',
                            extendedRequestId: 'asdf',
                            cfId: '',
                        };
                        client.put = jest.fn(function (params, cb) {
                            cb(error, params);
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, user.saveToDynamo(client)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        userResult_1 = _a.sent();
                        expect(userResult_1.errors[0]).toEqual(error);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        test('it should save even if oauth fields are empty', function () { return __awaiter(void 0, void 0, void 0, function () {
            var client, form;
            return __generator(this, function (_a) {
                client = new aws_sdk_1.DynamoDB.DocumentClient();
                form = new FormSubmission_1.FormSubmission({
                    apis: 'benefits,verification',
                    description: 'Mayhem',
                    email: 'ed@adhocteam.us',
                    firstName: 'Edward',
                    lastName: 'Paget',
                    organization: 'Ad Hoc',
                    termsOfService: true,
                });
                user = new User_1.User(form);
                user.saveToDynamo();
                return [2 /*return*/];
            });
        }); });
    });
    describe('toSlackString', function () {
        test('it should generate a properly formatted message', function () {
            var user = new User_1.User({
                apis: 'benefits,verification,facilities,claims',
                description: 'Mayhem',
                email: 'ed@adhocteam.us',
                firstName: 'Edward',
                lastName: 'Paget',
                oAuthRedirectURI: 'http://localhost:4000',
                organization: 'Ad Hoc',
                termsOfService: true,
            });
            expect(user.toSlackString()).toEqual('Paget, Edward: ed@adhocteam.us\nRequested access to:\n* benefits\n* verification\n* facilities\n* claims\n');
        });
    });
});
