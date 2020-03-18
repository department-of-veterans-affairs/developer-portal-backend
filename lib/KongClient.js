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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var request = __importStar(require("request-promise-native"));
var url_1 = require("url");
var config_1 = require("./config");
var KongClient = /** @class */ (function () {
    function KongClient(_a) {
        var apiKey = _a.apiKey, host = _a.host, _b = _a.port, port = _b === void 0 ? 8000 : _b, _c = _a.protocol, protocol = _c === void 0 ? 'https' : _c;
        this.kongPath = '/api_management/consumers';
        this.apiKey = apiKey;
        this.host = host;
        this.port = port;
        this.protocol = protocol;
    }
    KongClient.prototype.createConsumer = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var kongUser, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, request.get(this.requestOptions(this.kongPath + "/" + user.consumerName()))];
                    case 1:
                        kongUser = _a.sent();
                        if (kongUser) {
                            return [2 /*return*/, kongUser];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.debug('No existing consumer, creating new one');
                        return [3 /*break*/, 3];
                    case 3: return [4 /*yield*/, request.post(this.requestOptions(this.kongPath, { username: user.consumerName() }))];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    KongClient.prototype.createACLs = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var groups;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, request.get(this.requestOptions(this.kongPath + "/" + user.consumerName() + "/acls"))];
                    case 1:
                        groups = (_a.sent())
                            .data.map(function (_a) {
                            var group = _a.group;
                            return group;
                        });
                        return [4 /*yield*/, user.apiList
                                .reduce(function (toBeWrittenApis, api) {
                                var group = config_1.apisToAcls[api];
                                if (group && (groups.indexOf(group) === -1)) {
                                    toBeWrittenApis.push(api);
                                }
                                return toBeWrittenApis;
                            }, [])
                                .reduce(function (responses, api) { return __awaiter(_this, void 0, void 0, function () {
                                var group, response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            group = config_1.apisToAcls[api];
                                            return [4 /*yield*/, request.post(this.requestOptions(this.kongPath + "/" + user.consumerName() + "/acls", { group: group }))];
                                        case 1:
                                            response = _a.sent();
                                            responses[api] = response;
                                            return [2 /*return*/, responses];
                                    }
                                });
                            }); }, {})];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    KongClient.prototype.createKeyAuth = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, request.post(this.requestOptions(this.kongPath + "/" + user.consumerName() + "/key-auth"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    KongClient.prototype.requestOptions = function (path, body) {
        var url = url_1.format({
            hostname: this.host,
            pathname: path,
            port: this.port,
            protocol: this.protocol,
        });
        var headers = {
            apiKey: this.apiKey,
        };
        if (body) {
            return { body: body, url: url, headers: headers, json: true };
        }
        else {
            return { url: url, headers: headers, json: true };
        }
    };
    return KongClient;
}());
exports.KongClient = KongClient;
