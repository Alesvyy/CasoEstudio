const Usuario = require('../models/Usuario');

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { correo } = req.body;
    
    // Validamos si el correo ya existe para no duplicar (Código 400)
    const existe = await Usuario.findOne({ correo });
    if (existe) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    const nuevoUsuario = new Usuario(req.body);
    const guardado = await nuevoUsuario.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear usuario', error });
  }
};

// POST - Iniciar Sesión (Punto 4.a.iii)
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // 1. Buscamos al usuario por su correo
    const usuario = await Usuario.findOne({ correo });
    
    // 2. Si no existe o la contraseña no coincide (Código 401: No autorizado)
    if (!usuario || usuario.password !== password) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const actualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar usuario', error });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error });
  }
};