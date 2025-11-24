import { pool } from '../database/db.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// 1. CONFIGURACIÓN (Access Token del server.js que te pasaron)
// Nota: Este token parece de producción o prueba, úsalo tal cual te lo pasaron.
const client = new MercadoPagoConfig({
    accessToken: "APP_USR-938408163245439-102716-40635c48fb3052a0e1ad82a4427cf7a0-2950889360"
});

const createPreference = async (req, res) => {
    try {
        // Recibimos los datos reales desde tu Frontend
        const { titulo, cantidad, precio } = req.body;

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        title: titulo,
                        quantity: Number(cantidad),
                        unit_price: Number(precio),
                        currency_id: 'ARS',
                    },
                ],
                back_urls: {
                    success: "https://danscodedev.github.io/cinedsi/git/success.html",
                    failure: "https://danscodedev.github.io/cinedsi/git/failure.html",
                    pending: "https://danscodedev.github.io/cinedsi/git/pending.html",
                },
                auto_return: "approved",
            },
        });
        
        res.json({
            preferenceId: result.id,
            init_point: result.init_point // <--- ESTE ES EL LINK MÁGICO
        });

    } catch (error) {
        console.error("Error creando preference: ", error);
        res.status(500).json({ error: "Error creando preference" });
    }
};

const agregarPelicula = async (req, res) => {

    try {
        const { nombre, duracion, lanzamiento, descripcion, CATEGORIA_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo de imagen' });
        }

        const imagenUrl = req.file.path;

        const [result] = await pool.query(
            'INSERT INTO pelicula (nombre, duracion, lanzamiento, descripcion, imagen, estreno, CATEGORIA_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre, duracion, lanzamiento, descripcion, imagenUrl, 0, CATEGORIA_id]
        );

        res.status(201).json({
            id: result.insertId,
            nombre,
            duracion,
            lanzamiento,
            descripcion,
            imagen: imagenUrl,
            CATEGORIA_id,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al crear la película' });
    }
};

const getPeliculas = async (req, res) => {
    try {

        const [rows] = await pool.query('SELECT * FROM pelicula');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las películas' });
    }
};

const getPeliculasPorCategoria = async (req, res) => {

    try {
        const { CATEGORIA_id } = req.query;
        const [rows] = await pool.query('SELECT * FROM pelicula WHERE CATEGORIA_id = ?', [CATEGORIA_id]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las películas' });
    }
}

const getPeliculaPorId = async (req, res) => {
    try {
        const { id } = req.query;
        console.log(id)
        const [peli] = await pool.query('SELECT * FROM pelicula WHERE id = ?', [id]);

        res.json(peli)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la película' });
    }
}

const getCategorias = async (req, res) => {
    try {
        const [cat] = await pool.query('SELECT * FROM categoria');
        res.json(cat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las películas' });
    }
}

const agregarFuncion = async (req, res) => {
    try {
        const { fecha, hora, PELICULA_id, SALA_id } = req.body;
        const [result] = await pool.query('INSERT INTO funcion (fecha, hora, PELICULA_id, SALA_id) VALUES (?, ?, ?, ?)',
            [fecha, hora, PELICULA_id, SALA_id])

        res.status(201).json({
            id: result.insertId,
            fecha,
            hora,
            PELICULA_id,
            SALA_id,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al crear la funcion' });
    }
}

const getFunciones = async (req, res) => {
    try {
        const [funciones] = await pool.query('SELECT * FROM funcion');
        res.json(funciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las funciones' });
    }
}

const getFuncionesForAdmin = async (req, res) => {
    try {
        const [funciones] = await pool.query('SELECT f.id, f.fecha, f.hora, p.nombre AS pelicula, s.nombre AS sala,e.precio                FROM funcion f INNER JOIN pelicula p ON f.PELICULA_id = p.id INNER JOIN sala s ON f.SALA_id = s.id LEFT JOIN entrada e ON e.FUNCION_id = f.id WHERE estado = ? ORDER BY f.fecha DESC', [1]);

        res.json(funciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las funciones' });
    }
}

const agregarSala = async (req, res) => {
    try {
        const { nombre, capacidad } = req.body;
        const [result] = await pool.query('INSERT INTO sala (nombre, capacidad) VALUES (?, ?)', [nombre, capacidad]);

        res.status(201).json({
            id: result.insertId,
            nombre,
            capacidad,
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al crear la sala' });
    }
}

const getSalas = async (req, res) => {
    try {
        const [salas] = await pool.query('SELECT * FROM sala');
        res.json(salas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las salas' });
    }
}

const agregarEntrada = async (req, res) => {
    try {
        const [FUNCION_id, precio] = req.body;
        const [result] = await pool.query('INSERT INTO entrada (precio, FUNCION_id) values (?, ?)', [precio, FUNCION_id]);

        res.status(201).json({
            id: result.insertId,
            precio,
            FUNCION_id,
        })
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la entrada' });

    }
}


const crearFuncionyEntrada = async (req, res) => {

    const connection = await pool.getConnection();

    try {
        const { PELICULA_id, SALA_id, fecha, hora, precio } = req.body;

        // A partir de aquí, nada se guarda "de verdad" hasta que hagamos commit
        await connection.beginTransaction();

        const [resultFuncion] = await connection.execute(
            'INSERT INTO funcion (fecha, hora, estado, PELICULA_id, SALA_id) VALUES (?, ?, ?, ?, ?)',
            [fecha, hora, true, PELICULA_id, SALA_id]
        );

        // Obtenemos el ID que se acaba de generar
        const funcionIdGenerado = resultFuncion.insertId;

        await connection.execute(
            'INSERT INTO entrada (precio, FUNCION_id) VALUES (?, ?)',
            [precio, funcionIdGenerado]
        );

        await connection.commit();

        res.json({
            message: 'Éxito total',
            id: funcionIdGenerado
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error en la transacción', error: error.message });

    } finally {
        // Siempre liberar la conexión al final
        connection.release();
    }
}

const deleteFuncion = async (req, res) => {
    try {
        const { id } = req.query;

        const result = await pool.query('update funcion set estado = ? where id = ?', [0, id]);

        res.status(200).json({
            msg: 'Funcion dada de baja correctamente'
        })

    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la funcion' });
    }
}

const getPeliculasPorEstreno = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pelicula WHERE estreno = ?', [1]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las películas' });
    }
}

const getFuncionPorIdDePelicula = async (req, res) => {

    try {
        const { PELICULA_id } = req.query;

        if (!PELICULA_id) {
            return res.status(400).json({ message: 'Falta el ID de la película' });
        }

        const sql = `
            SELECT 
                f.id, 
                f.fecha, 
                f.hora, 
                s.nombre AS nombre_sala, 
                s.capacidad,
                e.precio
            FROM funcion f
            INNER JOIN sala s ON f.SALA_id = s.id
            LEFT JOIN entrada e ON e.FUNCION_id = f.id
            WHERE f.PELICULA_id = ? AND f.estado = 1
            ORDER BY f.fecha ASC, f.hora ASC
        `;

        const [rows] = await pool.query(sql, [PELICULA_id]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las funciones' });
    }
}

export {
    agregarPelicula,
    getPeliculas,
    getPeliculaPorId,
    getPeliculasPorCategoria,
    getCategorias,
    agregarFuncion,
    agregarSala,
    getFunciones,
    getSalas,
    agregarEntrada,
    crearFuncionyEntrada,
    getFuncionesForAdmin,
    deleteFuncion,
    getPeliculasPorEstreno,
    getFuncionPorIdDePelicula,
    createPreference
}