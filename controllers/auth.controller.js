// controllers/auth.controller.js
import { pool } from '../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

// --- REGISTRAR UN USUARIO ---
export const register = async (req, res) => {
    const { email, contrasenia, nombre, apellido, telefono, fechanacimiento } = req.body;

    // Necesitamos una conexión específica del pool para manejar la transacción
    let connection;

    try {

        const ROL_id = 2;

        connection = await pool.getConnection();

        // Iniciar la transacción
        await connection.beginTransaction();

        // Hashear la contraseña
        const passwordHash = await bcrypt.hash(contrasenia, 10);

        // Guardar en la tabla 'usuario'
        const [userResult] = await connection.query(
            'INSERT INTO usuario (email, contrasenia, ROL_id) VALUES (?, ?, ?)',
            [email, passwordHash, ROL_id]
        );

        // Obtener el ID del usuario recién creado
        const newUserId = userResult.insertId;

        //  Guardar en la tabla 'perfil_usuario' usando el newUserId
        await connection.query(
            'INSERT INTO perfil_usuario (nombre, apellido, email, telefono, fechanacimiento, USUARIO_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, telefono, fechanacimiento, newUserId]
        );

        // 7. Si todo salió bien, "confirma" los cambios
        await connection.commit();

        // 8. Crear el token para el auto-login
        const token = jwt.sign({ id: newUserId }, JWT_SECRET, {
            expiresIn: '1h',
        });

        const userPayload = {
            id: newUserId,
            nombre: nombre,
            apellido: apellido,
            email: email,
            rol: ROL_id
        };

        // 9. Enviar la respuesta
        res.status(201).json({
            token,
            user: userPayload // <-- Envía el usuario también
        });

    } catch (error) {
        // 10. Si algo falló, "deshace" todos los cambios de esta transacción
        if (connection) {
            await connection.rollback();
        }

        // Manejo de error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
        }
        console.error(error); // Es bueno ver el error completo en la consola del servidor
        res.status(500).json({ message: 'Error en el servidor', error: error.message });

    } finally {
        // 11. Pase lo que pase, libera la conexión de vuelta al pool
        if (connection) {
            connection.release();
        }
    }
};


// --- INICIAR SESIÓN (El endpoint que pediste) ---
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar al usuario por email
        const [rows] = await pool.query(
            'SELECT * FROM usuario WHERE email = ?',
            [email]
        );

        // Si el usuario no existe
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const user = rows[0];

        // Comparar la contraseña
        const isMatch = await bcrypt.compare(password, user.contrasenia);

        // 4. Si la contraseña no coincide
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        // Si todo es correcto, crear el token JWT
        const tokenPayload = {
            id: user.id,
            rol: user.ROL_id, // Asume que tienes una columna 'role'
            email: user.email
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, {
            expiresIn: '1h',
        });

        // Enviar el token al cliente
        res.json({ token });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

// --- VERIFICAR TOKEN (Tu AuthContext lo necesita) ---
export const verifyToken = async (req, res) => {
    // El token se espera en el header 'Authorization'
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ message: 'No autorizado: Sin token' });
    }

    try {
        // Extraer el token (formato "Bearer <token>")
        const token = authorization.split(' ')[1];

        // Verificar el token
        const payload = jwt.verify(token, JWT_SECRET);

        // Buscar al usuario en la BD con el rol
        const [rows] = await pool.query(
            `SELECT 
                u.id, 
                u.email, 
                r.nombre AS rol
            FROM usuario u
            INNER JOIN ROL r ON u.ROL_id = r.id
            WHERE u.id = ?`,
            [payload.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario del token no encontrado' });
        }

        // Devolver los datos del usuario (sin la contraseña)
        res.json(rows[0]);

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'No autorizado: Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'No autorizado: Token expirado' });
        }
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};