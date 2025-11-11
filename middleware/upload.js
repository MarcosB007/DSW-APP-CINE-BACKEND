import multer from 'multer';
import path from 'path';

// 1. Configuración de Almacenamiento (diskStorage)
const storage = multer.diskStorage({
    
    // 1.1. Dónde se guardan los archivos
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Usa la carpeta 'uploads' que creamos
    },
    
    // 1.2. Cómo se nombran los archivos
    filename: function (req, file, cb) {
        // Para evitar nombres duplicados, agregamos la fecha
        // Ej: pelicula-1718123456789.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pelicula-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Filtro de Archivos (Opcional pero recomendado)
// Asegura que solo se suban imágenes
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error("Error: ¡Solo se permiten archivos de imagen (jpeg, jpg, png, gif)!"));
};

// 3. Inicializar Multer
export const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Límite de 5MB
    fileFilter: fileFilter
});