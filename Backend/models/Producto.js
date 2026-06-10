const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  descripcion: {
    type: String
  },
  imagen: {
    type: String
  },
  categoria: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Categoria',
  required: true
},
  stock: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Producto', productoSchema);