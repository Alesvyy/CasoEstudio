const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const conectarDB = require('./config/DB');

dotenv.config();
conectarDB();

const app = express();

// Evita que Express muestre información del framework en las respuestas
app.disable('x-powered-by');

// Configuración de CORS con origen controlado
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());

// rutas del producto
app.use('/api/productos', require('./routes/producto.routes'));
// ruta de la categoria
app.use('/api/categorias', require('./routes/categoria.routes'));
// ruta de usuario 
app.use('/api/usuarios', require('./routes/usuario.routes'));
// ruta del carrito
app.use('/api/carritos', require('./routes/carrito.routes'));
// ruta de la orden 
app.use('/api/ordenes', require('./routes/orden.routes'));

app.get('/', (req, res) => {
  res.send('API funcionando correctamente');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});