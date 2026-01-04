import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import type { IUser } from 'src/modules/user/user.interface';
import { User } from 'src/modules/user/user.model';
// import User from 'src/modules/user/user.model';

passport.use(
    new LocalStrategy(
        {
            usernameField: 'identifier',
            passwordField: 'password',
            passReqToCallback: true,
        },
        async (req, identifier, password, done) => {
            const { website } = req.body;
            const user = await User.findOne({
                $or: [{ email: identifier }, { phone: identifier }],
            });
            if (!user) {
                return done(null, false, { message: 'Incorrect email or phone number.' });
            }
            const isMatch = await user.validatePassword(password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect email or phone number.' });
            }

            if (website === 'admin' && !['admin', 'teacher'].includes(user.role)) {
                return done(null, false, { message: 'Access denied for admin panel' });
            }

            return done(null, user);
        },
    ),
);

passport.serializeUser((user, done) => {
    done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
