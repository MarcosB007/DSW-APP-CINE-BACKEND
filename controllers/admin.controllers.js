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

export {
    agregarPelicula,
    getPeliculas
}