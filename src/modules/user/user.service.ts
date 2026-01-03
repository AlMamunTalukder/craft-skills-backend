import type { IUser } from './user.interface';
import User from './user.model';
import { IUserRole, IUserStatus } from './user.interface';

// Helper type for lean documents
type LeanUser = Omit<IUser, keyof Document> & {
    _id: string;
};

// Your existing methods
const findUserById = async (id: string): Promise<IUser | null> => {
    return await User.findById(id).select('-password');
};

const findUserByEmail = async (email: string): Promise<IUser | null> => {
    return await User.findOne({ email }).select('-password');
};

const findUserByPhone = async (phone: string): Promise<IUser | null> => {
    return await User.findOne({ phone }).select('-password');
};

const findUserByEmailOrPhone = async (identifier: string): Promise<IUser | null> => {
    return await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
    });
};

const createUser = async (data: Partial<IUser>): Promise<IUser> => {
    // Ensure required fields have defaults
    const userData: any = {
        ...data,
        role: data.role || IUserRole._STUDENT,
        status: data.status || IUserStatus._ACTIVE,
    };

    // Make sure name is provided
    if (!userData.name) {
        throw new Error('Name is required');
    }

    // Ensure undefined for empty optional fields
    if (!userData.email) {
        userData.email = undefined;
    }

    if (!userData.phone) {
        userData.phone = undefined;
    }

    return await User.create(userData);
};

const updateUser = async (id: string, data: Partial<IUser>): Promise<IUser | null> => {
    return await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
};

// New methods for role-based user management
const getAllUsers = async (role?: string): Promise<LeanUser[]> => {
    const filter: any = {};

    if (role) {
        filter.role = role;
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();

    // Cast to LeanUser type
    return users as unknown as LeanUser[];
};

// Alias for findUserById to maintain consistency
const getUserById = async (id: string): Promise<IUser | null> => {
    return await findUserById(id);
};

const deleteUser = async (id: string): Promise<void> => {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new Error('User not found');
};

const updateUserStatus = async (id: string, status: string): Promise<IUser | null> => {
    return await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
};

const resetUserPassword = async (id: string, newPassword: string): Promise<void> => {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    // Set password - the pre-save hook will hash it
    user.password = newPassword;
    await user.save();
};

const getUserStats = async () => {
    const stats = await User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                active: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                role: '$_id',
                count: 1,
                active: 1,
                inactive: { $subtract: ['$count', '$active'] },
            },
        },
        {
            $sort: { role: 1 },
        },
    ]);

    return stats;
};

const userService = {
    // Your existing methods
    findUserById,
    findUserByEmail,
    findUserByPhone,
    findUserByEmailOrPhone,
    createUser,
    updateUser,

    // New methods for user management
    getAllUsers,
    getUserById,
    deleteUser,
    updateUserStatus,
    resetUserPassword,
    getUserStats,
};

export default userService;
