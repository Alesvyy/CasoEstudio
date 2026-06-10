const Categoria = require('../models/Categoria');

exports.obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error });
  }
};

exports.crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    const existe = await Categoria.findOne({ nombre });
    if (existe) return res.status(400).json({ mensaje: 'Esta categoría ya existe' });

    const nuevaCategoria = new Categoria(req.body);
    const guardada = await nuevaCategoria.save();
    res.status(201).json(guardada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear categoría', error });
  }
};

exports.actualizarCategoria = async (req, res) => {
  try {
    const actualizada = await Categoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizada) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar categoría', error });
  }
};

exports.eliminarCategoria = async (req, res) => {
  try {
    const eliminada = await Categoria.findByIdAndDelete(req.params.id);
    if (!eliminada) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar categoría', error });
  }
};