"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IUserStatus = exports.IUserRole = void 0;
var IUserRole;
(function (IUserRole) {
    IUserRole["_STUDENT"] = "student";
    IUserRole["_ADMIN"] = "admin";
    IUserRole["_TEACHER"] = "teacher";
})(IUserRole || (exports.IUserRole = IUserRole = {}));
var IUserStatus;
(function (IUserStatus) {
    IUserStatus["_ACTIVE"] = "active";
    IUserStatus["_INACTIVE"] = "inactive";
    IUserStatus["_BANNED"] = "banned";
})(IUserStatus || (exports.IUserStatus = IUserStatus = {}));
