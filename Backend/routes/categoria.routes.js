const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoria.controller');

router.get('/', ctrl.obtenerCategorias);
router.post('/', ctrl.crearCategoria);
router.put('/:id', ctrl.actualizarCategoria);
router.delete('/:id', ctrl.eliminarCategoria);

module.exports = router;