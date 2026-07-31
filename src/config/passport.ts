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

            if (user.status !== 'active') {
                return done(null, false, { message: 'This account is not active.' });
            }

            if (website === 'admin' && !['admin', 'teacher'].includes(user.role)) {
                return done(null, false, { message: 'Access denied for admin panel' });
            }

            return done(null, user);
        },
    ),
);

passport.serializeUser((user, done) => {
    const authenticatedUser = user as IUser;
    done(null, {
        id: authenticatedUser._id.toString(),
        sessionVersion: (authenticatedUser as any).sessionVersion || 0,
    });
});

passport.deserializeUser(async (id, done) => {
    try {
        const session =
            typeof id === 'object' && id !== null
                ? (id as { id: string; sessionVersion?: number })
                : { id: String(id) };
        const user = await User.findById(session.id);

        if (
            !user ||
            user.status !== 'active' ||
            session.sessionVersion === undefined ||
            user.sessionVersion !== session.sessionVersion
        ) {
            return done(null, false);
        }

        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
