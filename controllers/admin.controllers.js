import { db } from "../database/db.js";

const obtenerPeliculas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pelicula');
        res.json(rows);
        console.log("Operacion exitosa");
    } catch (error) {
        console.error('Error al obtener las peliculas:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
}

export {
    obtenerPeliculas
}