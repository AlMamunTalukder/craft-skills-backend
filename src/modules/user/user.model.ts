import { Schema, model, models } from 'mongoose';
import type { IUser } from './user.interface';
import { IUserRole, IUserStatus } from './user.interface';
import bcrypt from 'bcrypt';

const userSchema = new Schema<IUser>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: false, unique: true },
        phone: { type: String, required: false, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: [...Object.values(IUserRole)],
            required: true,
            default: IUserRole._STUDENT,
        },
        image: { type: String, required: false },
        status: {
            type: String,
            enum: [...Object.values(IUserStatus)],
            required: true,
            default: IUserStatus._ACTIVE,
        },
    },
    {
        timestamps: true,
    },
);

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.validatePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = models.User || model<IUser>('User', userSchema);

export default User;
