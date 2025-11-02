import type { IUser } from './user.interface';
import User from './user.model';

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
    }).select('-password');
};

const createUser = async (data: Partial<IUser>): Promise<IUser> => {
    return await User.create(data);
};

const updateUser = async (id: string, data: Partial<IUser>): Promise<IUser | null> => {
    return await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
};

const userService = {
    findUserById,
    findUserByEmail,
    findUserByPhone,
    findUserByEmailOrPhone,
    createUser,
    updateUser,
};

export default userService;
