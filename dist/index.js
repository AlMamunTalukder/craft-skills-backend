"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./routes/index"));
const logger_1 = __importDefault(require("./shared/logger"));
const requestLogger_1 = __importDefault(require("./shared/requestLogger"));
const errorHandler_1 = __importDefault(require("./shared/errorHandler"));
const globalErrorHandlers_1 = __importDefault(require("./shared/globalErrorHandlers"));
const db_1 = __importDefault(require("./shared/db"));
const index_2 = __importDefault(require("./config/index"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const notFound_1 = __importDefault(require("./routes/notFound"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const redis_1 = require("./config/redis");
(0, globalErrorHandlers_1.default)();
const app = (0, express_1.default)();
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)());
app.use(requestLogger_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    secret: index_2.default.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({ mongoUrl: index_2.default.databaseUrl }),
    cookie: {
        secure: false, // keep false for local dev
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use('/api/v1', index_1.default);
app.get('/', (req, res) => {
    res.send('Hello, world!');
});
app.use('/health', (req, res) => {
    res.status(200).send('OK');
});
app.use(notFound_1.default);
app.use(errorHandler_1.default);
async function bootstrap() {
    await (0, db_1.default)();
    await (0, redis_1.connectRedis)();
    app.listen(index_2.default.port, () => {
        logger_1.default.info(`Server is running on port ${index_2.default.port}`);
    });
}
bootstrap();
