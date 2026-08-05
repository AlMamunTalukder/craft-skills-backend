"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const user_model_1 = require("../modules/user/user.model");
// import User from '../modules/user/user.model';
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'identifier',
    passwordField: 'password',
    passReqToCallback: true,
}, async (req, identifier, password, done) => {
    const { website } = req.body;
    const user = await user_model_1.User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
    });
    if (!user) {
        return done(null, false, { message: 'Incorrect email or phone number.' });
    }
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
        return done(null, false, { message: 'Incorrect email or phone number.' });
    }
    if (user.status !== 'active') {
        return done(null, false, { message: 'This account is not active.' });
    }
    if (website === 'admin' && !['admin', 'teacher'].includes(user.role)) {
        return done(null, false, { message: 'Access denied for admin panel' });
    }
    return done(null, user);
}));
passport_1.default.serializeUser((user, done) => {
    const authenticatedUser = user;
    done(null, {
        id: authenticatedUser._id.toString(),
        sessionVersion: authenticatedUser.sessionVersion || 0,
    });
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const session = typeof id === 'object' && id !== null
            ? id
            : { id: String(id) };
        const user = await user_model_1.User.findById(session.id);
        if (!user ||
            user.status !== 'active' ||
            session.sessionVersion === undefined ||
            (user.sessionVersion ?? 0) !== session.sessionVersion
        //  user.sessionVersion !== session.sessionVersion
        ) {
            return done(null, false);
        }
        done(null, user);
    }
    catch (error) {
        done(error);
    }
});
exports.default = passport_1.default;
