import { Router } from "express";

// 1. Importa tu middleware de multer
import { upload } from '../middleware/upload.js';
// 2. Importa el middleware que revisa si es admin (¡importante!)
import { authRequired, isAdmin } from '../middleware/validateToken.js';
// 3. (Asumo que tienes un pool de MySQL)
import { agregarEntrada, agregarFuncion, agregarPelicula, agregarSala, crearFuncionyEntrada, deleteFuncion, getCategorias, getFunciones, getFuncionesForAdmin, getPeliculaPorId, getPeliculas, getPeliculasPorCategoria, getPeliculasPorEstreno, getSalas } from "../controllers/admin.controllers.js";

const routerAdmin = Router();

// console.log("--- DEBUGGING HANDLERS ---");
// console.log("authRequired: ", typeof authRequired);
// console.log("isAdmin: ", typeof isAdmin);
// console.log("upload: ", typeof upload);
// console.log("agregarPelicula: ", typeof agregarPelicula);
// console.log("----------------------------");
routerAdmin.get('/peliculas', getPeliculas);
routerAdmin.get('/peliculasPorCategoria', getPeliculasPorCategoria);
routerAdmin.get('/getPeliculaPorId', getPeliculaPorId);
routerAdmin.get('/categorias', getCategorias);
routerAdmin.post('/agregarPelicula', authRequired, isAdmin, upload.single('imagen'), agregarPelicula);
routerAdmin.post('/agregarFuncion', agregarFuncion);
routerAdmin.post('/agregarSala', agregarSala);
routerAdmin.get('/getFunciones', getFunciones);
routerAdmin.get('/getSalas', getSalas);
routerAdmin.post('/agregarEntrada', agregarEntrada);
routerAdmin.post('/agregarFuncionEntrada', crearFuncionyEntrada);
routerAdmin.get('/getFuncionesForAdmin', getFuncionesForAdmin);
routerAdmin.put('/eliminarFuncion', deleteFuncion);
routerAdmin.get('/getPeliculasPorEstreno', getPeliculasPorEstreno);



export default routerAdmin;