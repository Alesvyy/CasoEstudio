const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuario.controller');

// Rutas actuales
router.get('/', ctrl.obtenerUsuarios);
router.post('/', ctrl.crearUsuario);
router.put('/:id', ctrl.actualizarUsuario);
router.delete('/:id', ctrl.eliminarUsuario);

// NUEVA RUTA: Inicio de sesión (Punto 4.a.iii)
router.post('/login', ctrl.login); 

module.exports = router;