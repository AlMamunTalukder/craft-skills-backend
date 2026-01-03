import { Schema, model, models } from 'mongoose';
import type { IUser } from './user.interface';
import { IUserRole, IUserStatus } from './user.interface';
import bcrypt from 'bcrypt';

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: false,
            unique: true,
            sparse: true, // This is the key fix
            lowercase: true,
            trim: true,
            default: undefined, // Use undefined instead of null
        },
        phone: {
            type: String,
            required: false,
            unique: true,
            sparse: true, // This is the key fix
            trim: true,
            default: undefined, // Use undefined instead of null
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: Object.values(IUserRole),
            required: true,
            default: IUserRole._STUDENT,
        },
        image: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: Object.values(IUserStatus),
            required: true,
            default: IUserStatus._ACTIVE,
        },
        batchNumber: {
            type: String,
            required: true,
            trim: true,
        },
        batchId: {
            type: Schema.Types.ObjectId,
            ref: 'CourseBatch',
            required: false,
        },
        admissionId: {
            type: Schema.Types.ObjectId,
            ref: 'Admission',
            required: false,
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

userSchema.pre('save', function (next) {
    // Ensure empty strings become undefined (not null)
    if (this.email === '' || this.email === null) {
        this.email = undefined;
    }
    if (this.phone === '' || this.phone === null) {
        this.phone = undefined;
    }
    next();
});

userSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as any;

    if (update?.$set) {
        if (update.$set.email === '' || update.$set.email === null) {
            update.$set.email = undefined;
        }
        if (update.$set.phone === '' || update.$set.phone === null) {
            update.$set.phone = undefined;
        }
    }
    next();
});

// Add indexes - make sure they are sparse
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ batchNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = models.User || model<IUser>('User', userSchema);

export default User;
