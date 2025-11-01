'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const index_1 = __importDefault(require('./routes/index'));
const logger_1 = __importDefault(require('./shared/logger'));
const requestLogger_1 = __importDefault(require('./shared/requestLogger'));
const errorHandler_1 = __importDefault(require('./shared/errorHandler'));
const globalErrorHandlers_1 = __importDefault(require('./shared/globalErrorHandlers'));
const db_1 = __importDefault(require('./shared/db'));
const index_2 = __importDefault(require('./config/index'));
(0, globalErrorHandlers_1.default)();
const app = (0, express_1.default)();
async function bootstrap() {
    await (0, db_1.default)();
    app.listen(index_2.default.port, () => {
        logger_1.default.info(`Server is running on port ${index_2.default.port}`);
    });
}
bootstrap();
app.use(requestLogger_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/v1', index_1.default);
app.get('/', (req, res) => {
    res.send('Hello, world!');
});
app.use(errorHandler_1.default);
