import { Router } from 'express';
import authController from './auth.controller';
import validateRequest from 'src/utils/validateRequest';
import { LoginDto, RegisterDto } from './auth.dto';

const authRoutes = Router();

authRoutes.post('/register', validateRequest(RegisterDto), authController.register);
authRoutes.post('/login', validateRequest(LoginDto), authController.login);
authRoutes.post('/logout', authController.logout);

export default authRoutes;
