// src/middleware/validateToken.js

import jwt from 'jsonwebtoken';
 // Asegúrate de que la ruta a tu JWT_SECRET sea correcta
import { pool } from '../database/db.js'; // Importa tu pool de conexión a MySQL

/**
 * GUARDIA 1: Revisa si el usuario está logueado (autenticado)
 * Verifica que el token de la cookie sea válido.
 */
export const authRequired = (req, res, next) => {
    // 1. Buscamos el token en las cookies
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: 'No autorizado: Sin token' });
    }

    try {
        // 2. Verificamos el token
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // 3. ¡Importante! Adjuntamos el ID del usuario al objeto 'req'
        //    para que el siguiente middleware (o controlador) pueda usarlo.
        req.userId = payload.id;
        
        // 4. Si todo bien, pasa al siguiente middleware
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'No autorizado: Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'No autorizado: Token expirado' });
        }
        return res.status(500).json({ message: 'Error interno al verificar el token' });
    }
};

/**
 * GUARDIA 2: Revisa si el usuario es Administrador (autorizado)
 * ESTE MIDDLEWARE DEBE IR *DESPUÉS* DE authRequired.
 */
export const isAdmin = async (req, res, next) => {
    
    // 1. Gracias a 'authRequired', ya tenemos 'req.userId'
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Error: No se encontró ID de usuario (asegúrate de usar authRequired primero)' });
    }

    try {
        // 2. Buscamos al usuario en la BD (como hacías en verifyToken)
        const [rows] = await pool.query(
            `SELECT r.nombre AS rol
             FROM usuario u
             INNER JOIN ROL r ON u.ROL_id = r.id
             WHERE u.id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario del token no encontrado' });
        }

        // 3. Comprobamos el rol
        if (rows[0].rol === 'admin') {
            // 4. ¡Es admin! Pasa al controlador final (subir la película)
            next();
        } else {
            // 5. No es admin, le negamos el acceso
            return res.status(403).json({ message: 'Prohibido: No tienes permisos de administrador' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al verificar el rol', error: error.message });
    }
};