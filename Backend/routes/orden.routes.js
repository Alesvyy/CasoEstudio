const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orden.controller');

router.get('/', ctrl.obtenerOrdenes);
router.post('/', ctrl.crearOrden);
router.put('/:id', ctrl.actualizarOrden);
router.delete('/:id', ctrl.eliminarOrden);

module.exports = router;