import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import AppError from 'src/errors/AppError';
import User from 'src/modules/user/user.model';
import connectDB from 'src/shared/db';
import logger from 'src/shared/logger';
import { ADMIN_DATA, SITE_DATA } from './data';
import Site from 'src/modules/site/site.model';

const seed = async (): Promise<void> => {
    try {
        await connectDB();

        const isAdminExist = await User.findOne({ email: ADMIN_DATA.email });
        if (isAdminExist) {
            logger.info('Admin already exists');
        } else {
            const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, 10);
            await User.create({ ...ADMIN_DATA, password: hashedPassword });
            logger.info('Admin created');
        }

        const conteCount = await Site.countDocuments();
        if (conteCount === 0) {
            await Site.create(SITE_DATA);
            logger.info('Site data created');
        } else {
            logger.info('Site data already exists');
        }

        logger.info('Database seeding completed');
        process.exit(0);
    } catch (error: any) {
        logger.error('Seeding error:', error);
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Error while seeding the database');
    }
};

seed();
