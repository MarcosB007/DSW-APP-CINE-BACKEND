// controllers/auth.controller.js
import { pool } from '../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

// --- REGISTRAR UN USUARIO ---
export const register = async (req, res) => {
    const { email, contrasenia, nombre, apellido, telefono, fechanacimiento, ROL_id } = req.body;
    
    // 1. Necesitamos una conexión específica del pool para manejar la transacción
    let connection;
    
    try {
        connection = await pool.getConnection();
        
        // 2. Iniciar la transacción
        await connection.beginTransaction(); 

        // 3. Hashear la contraseña
        const passwordHash = await bcrypt.hash(contrasenia, 10);

        // 4. Guardar en la tabla 'usuario'
        const [userResult] = await connection.query(
            'INSERT INTO usuario (email, contrasenia, ROL_id) VALUES (?, ?, ?)',
            [email, passwordHash, ROL_id]
        );

        // 5. Obtener el ID del usuario recién creado
        const newUserId = userResult.insertId;

        // 6. Guardar en la tabla 'perfil_usuario' usando el newUserId
        // (Tu diagrama muestra que 'perfil_usuario' también tiene un campo 'email')
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

        // 9. Enviar la respuesta
        res.status(201).json({ token });

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


// // --- INICIAR SESIÓN (El endpoint que pediste) ---
// export const login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // 1. Buscar al usuario por email
//         const [rows] = await pool.query(
//             'SELECT * FROM usuarios WHERE email = ?',
//             [email]
//         );

//         // 2. Si el usuario no existe
//         if (rows.length === 0) {
//             return res.status(400).json({ message: 'Credenciales incorrectas' });
//         }

//         const user = rows[0];

//         // 3. Comparar la contraseña
//         const isMatch = await bcrypt.compare(password, user.password_hash);

//         // 4. Si la contraseña no coincide
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Credenciales incorrectas' });
//         }

//         // 5. Si todo es correcto, crear el token JWT
//         // (Tu frontend espera el rol, así que lo incluimos si existe)
//         const tokenPayload = {
//             id: user.id,
//             role: user.role, // Asume que tienes una columna 'role'
//             username: user.username
//         };
        
//         const token = jwt.sign(tokenPayload, JWT_SECRET, {
//             expiresIn: '1h',
//         });

//         // 6. Enviar el token al cliente
//         res.json({ token });

//     } catch (error) {
//         res.status(500).json({ message: 'Error en el servidor', error: error.message });
//     }
// };

// // --- VERIFICAR TOKEN (Tu AuthContext lo necesita) ---
// export const verifyToken = async (req, res) => {
//     // (Este endpoint es llamado por tu verifyTokenRequest)
//     // El token se espera en el header 'Authorization'
//     const { authorization } = req.headers;

//     if (!authorization) {
//         return res.status(401).json({ message: 'No autorizado: Sin token' });
//     }

//     try {
//         // 1. Extraer el token (formato "Bearer <token>")
//         const token = authorization.split(' ')[1];
        
//         // 2. Verificar el token
//         const payload = jwt.verify(token, JWT_SECRET);

//         // 3. Buscar al usuario en la BD con el ID del token
//         const [rows] = await pool.query(
//             'SELECT id, username, email, role FROM usuarios WHERE id = ?',
//             [payload.id]
//         );

//         if (rows.length === 0) {
//             return res.status(404).json({ message: 'Usuario del token no encontrado' });
//         }

//         // 4. Devolver los datos del usuario (sin la contraseña)
//         res.json(rows[0]);

//     } catch (error) {
//         if (error.name === 'JsonWebTokenError') {
//             return res.status(401).json({ message: 'No autorizado: Token inválido' });
//         }
//         if (error.name === 'TokenExpiredError') {
//             return res.status(401).json({ message: 'No autorizado: Token expirado' });
//         }
//         res.status(500).json({ message: 'Error en el servidor', error: error.message });
//     }
// };