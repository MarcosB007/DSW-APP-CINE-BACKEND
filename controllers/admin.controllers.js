import { pool } from '../database/db.js';

const agregarPelicula = async (req, res) => {

    try {
        // 3. Los datos de TEXTO vienen en 'req.body'
        const { nombre, duracion, lanzamiento, descripcion, CATEGORIA_id } = req.body;

        // 4. Los datos del ARCHIVO vienen en 'req.file'
        //    Si no se sube un archivo, req.file será 'undefined'
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo de imagen' });
        }

        // 5. Esta es la ruta que guardaremos en la BD
        const imagenUrl = req.file.path;
        // (Esto guardará algo como "uploads/pelicula-123456789.jpg")

        // 6. Insertar en la base de datos
        const [result] = await pool.query(
            'INSERT INTO pelicula (nombre, duracion, lanzamiento, descripcion, imagen, CATEGORIA_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, duracion, lanzamiento, descripcion, imagenUrl, CATEGORIA_id]
        );

        res.status(201).json({
            id: result.insertId,
            nombre,
            duracion,
            lanzamiento,
            descripcion,
            imagen: imagenUrl, // Devolvemos la ruta correcta
            CATEGORIA_id,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al crear la película' });
    }
};

const getPeliculas = async (req, res) => {
    try {
        // Obtenemos todas las películas de la base de datos
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
        const [funciones] = await pool.query('SELECT f.id, f.fecha, f.hora, p.nombre AS pelicula, s.nombre AS sala,e.precio                FROM funcion f INNER JOIN pelicula p ON f.PELICULA_id = p.id INNER JOIN sala s ON f.SALA_id = s.id LEFT JOIN entrada e ON e.FUNCION_id = f.id  ORDER BY f.fecha DESC');

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

// Endpoint: /crear-funcion-transaccion
const crearFuncionyEntrada = async (req, res) => {
    console.log("----> DATOS RECIBIDOS DEL FRONTEND:", req.body);
    // Obtenemos una conexión del pool para poder iniciar la transacción
    const connection = await pool.getConnection();

    try {
        const { PELICULA_id, SALA_id, fecha, hora, precio } = req.body;

        // 1. INICIAR TRANSACCIÓN
        // A partir de aquí, nada se guarda "de verdad" hasta que hagamos commit
        await connection.beginTransaction();

        // 2. INSERTAR LA FUNCIÓN
        const [resultFuncion] = await connection.execute(
            'INSERT INTO funcion (fecha, hora, PELICULA_id, SALA_id) VALUES (?, ?, ?, ?)',
            [fecha, hora, PELICULA_id, SALA_id]
        );

        // Obtenemos el ID que se acaba de generar
        const funcionIdGenerado = resultFuncion.insertId;

        // 3. INSERTAR EL PRECIO (ENTRADA) USANDO ESE ID
        await connection.execute(
            'INSERT INTO entrada (precio, FUNCION_id) VALUES (?, ?)',
            [precio, funcionIdGenerado]
        );

        // 4. CONFIRMAR CAMBIOS (COMMIT)
        // Si llegamos aquí, todo salió bien. Guardamos permanentemente.
        await connection.commit();

        // 5. Responder al cliente
        res.json({
            message: 'Éxito total',
            id: funcionIdGenerado
        });

    } catch (error) {
        // 6. SI ALGO FALLA... REVERTIR TODO (ROLLBACK)
        // Si falla el insert de entrada, se borra el insert de función automáticamente
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error en la transacción', error: error.message });

    } finally {
        // Siempre liberar la conexión al final
        connection.release();
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
    getFuncionesForAdmin
}