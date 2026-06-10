const Orden = require('../models/Orden');

exports.obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await Orden.find()
      .populate('usuario', 'nombre correo') // Solo traemos nombre y correo del usuario
      .populate('productos.producto');
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener órdenes', error });
  }
};

exports.crearOrden = async (req, res) => {
  try {
    const nuevaOrden = new Orden(req.body);
    const guardada = await nuevaOrden.save();
    res.status(201).json(guardada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear la orden, verifique stock o datos', error });
  }
};

exports.actualizarOrden = async (req, res) => {
  try {
    const actualizada = await Orden.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizada) return res.status(404).json({ mensaje: 'Orden no encontrada' });
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar orden', error });
  }
};

exports.eliminarOrden = async (req, res) => {
  try {
    const eliminada = await Orden.findByIdAndDelete(req.params.id);
    if (!eliminada) return res.status(404).json({ mensaje: 'Orden no encontrada' });
    res.json({ mensaje: 'Orden eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar orden', error });
  }
};