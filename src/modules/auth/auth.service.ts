import AppError from 'src/errors/AppError';
import userService from '../user/user.service';
import type { IRegisterDto } from './auth.dto';
import httpStatus from 'http-status';
import type { IUser } from '../user/user.interface';

const register = async (data: IRegisterDto): Promise<IUser> => {
    const existingUser = await userService.findUserByEmailOrPhone(data.email || data.phone!);
    if (existingUser) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User with given email or phone already exists');
    }

    return userService.createUser(data);
};

const authService = {
    register,
};

export default authService;
