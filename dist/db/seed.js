"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const user_model_1 = __importDefault(require("../modules/user/user.model"));
const db_1 = __importDefault(require("../shared/db"));
const logger_1 = __importDefault(require("../shared/logger"));
const data_1 = require("./data");
const site_model_1 = __importDefault(require("../modules/site/site.model"));
const seed = async () => {
    try {
        await (0, db_1.default)();
        const isAdminExist = await user_model_1.default.findOne({ email: data_1.ADMIN_DATA.email });
        if (isAdminExist) {
            logger_1.default.info('Admin already exists');
        }
        else {
            const hashedPassword = await bcrypt_1.default.hash(data_1.ADMIN_DATA.password, 10);
            await user_model_1.default.create({ ...data_1.ADMIN_DATA, password: hashedPassword });
            logger_1.default.info('Admin created');
        }
        const conteCount = await site_model_1.default.countDocuments();
        if (conteCount === 0) {
            await site_model_1.default.create(data_1.SITE_DATA);
            logger_1.default.info('Site data created');
        }
        else {
            logger_1.default.info('Site data already exists');
        }
        logger_1.default.info('Database seeding completed');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error(error, 'Seeding error:');
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Error while seeding the database');
    }
};
seed();
