const Carrito = require('../models/Carrito');

exports.obtenerCarritos = async (req, res) => {
  try {
    const carritos = await Carrito.find()
      .populate('usuario')
      .populate('productos.producto');
    res.json(carritos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener carritos', error });
  }
};

exports.crearCarrito = async (req, res) => {
  try {
    const nuevoCarrito = new Carrito(req.body);
    const guardado = await nuevoCarrito.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear carrito, verifique los datos', error });
  }
};

exports.actualizarCarrito = async (req, res) => {
  try {
    const actualizado = await Carrito.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ mensaje: 'Carrito no encontrado' });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar carrito', error });
  }
};

exports.eliminarCarrito = async (req, res) => {
  try {
    const eliminado = await Carrito.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Carrito no encontrado' });
    res.json({ mensaje: 'Carrito eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar carrito', error });
  }
};