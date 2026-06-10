const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/carrito.controller');

router.get('/', ctrl.obtenerCarritos);
router.post('/', ctrl.crearCarrito);
router.put('/:id', ctrl.actualizarCarrito);
router.delete('/:id', ctrl.eliminarCarrito);

module.exports = router;