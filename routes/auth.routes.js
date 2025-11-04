// routes/auth.routes.js
import { Router } from 'express';
import { login, register, verifyToken } from '../controllers/auth.controller.js';

const routerAuth = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyToken); // Tu AuthContext usa este

export default routerAuth;