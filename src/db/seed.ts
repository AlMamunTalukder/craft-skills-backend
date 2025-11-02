import AppError from 'src/errors/AppError';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import User from 'src/modules/user/user.model';
import { IUserRole } from 'src/modules/user/user.interface';
import logger from 'src/shared/logger';
import connectDB from 'src/shared/db';

const ADMIN = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '1234567890',
    password: 'Admin123',
    role: IUserRole._ADMIN,
};

const seed = async (): Promise<void> => {
    try {
        await connectDB();

        const isAdminExist = await User.findOne({ email: ADMIN.email });
        if (isAdminExist) {
            logger.info('Admin already exists');
        } else {
            const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
            await User.create({ ...ADMIN, password: hashedPassword });
            logger.info('Admin created');
        }

        logger.info('Database seeding completed');
        process.exit(0);
    } catch (error: any) {
        logger.error('Seeding error:', error);
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Error while seeding the database');
    }
};

seed();
