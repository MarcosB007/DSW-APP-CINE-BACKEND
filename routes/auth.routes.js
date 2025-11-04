// routes/auth.routes.js
import { Router } from 'express';
import { login, register, verifyToken } from '../controllers/auth.controller.js';

const routerAuth = Router();

routerAuth.post('/register', register);
routerAuth.post('/login', login);
routerAuth.get('/verify', verifyToken); // Tu AuthContext usa este

export default routerAuth;