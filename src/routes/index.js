const express = require('express');
const { parse } = require('path')
const { Server } = require('socket.io');
const router = express.Router();
const XLSX = require('xlsx');
const fs = require('fs-extra');
const mime = require('mime-types');
const { SerialPort } = require('serialport');
const bcrypt = require('bcrypt');
let port;
let io;
let tag = "";
let isConnected = false;
const { connection } = require('../database');
function configureSocket(server) {
  io = new Server(server);
  io.setMaxListeners(0);
  io.on("connection", (socket) => {
    socket.on('estado:data', (data) => {
      port.write(data);
    });
  });
}

router.get("/admin", async (req, res) => {
  res.render("admin");
});

router.get("/pedidos", async (req, res) => {
  res.render("pedidos");
});
router.get("/analisis", async (req, res) => {
  res.render("analisis");
});
router.get("/registrarproductos", async (req, res) => {
  const arduinoUnoVendorIds = ['2341', '2A03'];
  SerialPort.list().then(ports => {
    ports.forEach(function (port) {
      if (typeof port['manufacturer'] !== 'undefined') {
      
        console.log(port);
      }
    });
  });
  SerialPort.list()
    .then((result) => {
      const connectedArduinoUno = result.find((port) => arduinoUnoVendorIds.includes(port.vendorId));
      if (connectedArduinoUno && !isConnected) {
        port = new SerialPort({
          path: connectedArduinoUno.path,
          baudRate: 9600
        });
        port.on('error', function (err) {
          io.emit('estado:data', {
            estado: "Desconectado"
          });
          console.log('Error:', err.message);
        });

        port.on('open', () => {
          io.emit('estado:data', {
            estado: "Conectado"
          });
          console.log('Conectado');
          isConnected = true;
          port.on('data', async (data) => {
            if (!data.toString().includes('\n')) {
              tag += data.toString();
            } else {
              tag += data.toString();
              let productoEncontrado = await buscarProducto(tag.trim());
              if (productoEncontrado) {
                io.emit('arduino:data', {
                  codigo: productoEncontrado.codigo,
                  categoria: productoEncontrado.categoria,
                  nombre: productoEncontrado.nombre,
                  descripcion: productoEncontrado.descripcion,
                  precio: productoEncontrado.precio,
                  imagen: productoEncontrado.imagen
                });
              } else {
                io.emit('arduino:data', {
                  value: "Producto no reconocido"
                });

              }
              tag = "";
            }
          });
        });
        port.on('close', () => {
          io.emit('estado:data', {
            estado: "Desconectado"
          });
          console.log('Desconectado');
          isConnected = false;
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
  res.render("registrarproductos", { isConnected });
});

async function buscarProducto(tag) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria AND tag = ?";
    connection.query(sql, [tag], (error, results) => {
      if (error) {
        reject(error);
      } else {
        if (results.length > 0) {
          resolve(results[0]);
        } else {
          resolve(null);
        }
      }
    });
  });
}

router.get("/", async (req, res) => {
  req.session.credentials = {
    cliente: req.session.credentials.cliente,
    administrador: req.session.credentials.admin
  };
  credentials = req.session.credentials.cliente;
  const query = 'SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria';
  connection.query(query, async (error, results) => {
    if (error) {
      res.send(error.message);
      callback(error, null);
      return;
    }
    res.render("index", { credentials, results });
  });
});
router.get("/panel", async (req, res) => {
  res.render("panel");
});
router.get("/kardex", async (req, res) => {
  res.render("kardex");
});
router.get("/pedido", async (req, res) => {
  res.render("pedido");
});
router.get("/importarexcel", async (req, res) => {
  res.render("importarexcel", { data: null, clientes: null, productos: null, fileStats: null });
});
router.post('/importarexcel', async (req, res) => {
  try {
    const file = req.files.file;// Accede al archivo cargado desde la solicitud
    const fileStats = {
      name: file.name.substring(0, file.name.lastIndexOf('.')),
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      type: mime.extension(file.mimetype)
    };
    // Mueve el archivo a una ubicación temporal en el servidor
    await fs.ensureDir('uploads');
    await file.mv('uploads/' + file.name);
    const startTime = Date.now();
    // Procesa el archivo Excel
    const workbook = XLSX.readFile('uploads/' + file.name);
    const sheetName = workbook.SheetNames[1];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 2 });

    let facturas = new Array();
    let productos = new Array();
    let clientes = new Array();
    jsonData.forEach(function (data) {
      const values = Object.values(data);
      if (values[1] != "-") {
        facturas.push({
          nombre: values[1],
          direccion: values[2],
          identificacion: values[3],
          telefono: values[4]
        });
      }
    });

    jsonData.forEach(function (data) {
      const values = Object.values(data);
      if (values[1] != "-") {
        clientes.push({
          nombre: values[1],
          direccion: values[2],
          identificacion: values[3],
          telefono: values[4]
        });
      }
      if (values[7] != "-") {
        productos.push({
          codigo: values[7],
          descripcion: values[8],
          medida: values[9],
          precio: values[10],
        });
      }
      if (values[13] != "-") {
        productos.push({
          codigo: values[13],
          descripcion: values[14],
          medida: values[15],
          precio: values[16],
        });
      }
      if (values[19] != "-") {
        productos.push({
          codigo: values[19],
          descripcion: values[20],
          medida: values[21],
          precio: values[22],
        });
      }
      if (values[25] != "-") {
        productos.push({
          codigo: values[25],
          descripcion: values[26],
          medida: values[27],
          precio: values[28],
        });
      }
      if (values[31] != "-") {
        productos.push({
          codigo: values[31],
          descripcion: values[32],
          medida: values[33],
          precio: values[34],
        });
      }
    });

    const dataClientes = new Set();
    clientes.forEach(cliente => {
      if (!dataClientes.has(cliente.nombre)) {
        dataClientes.add(cliente.nombre);
      }
    });
    clientes = Array.from(dataClientes).map(nombre => clientes.find(cliente => cliente.nombre === nombre));
    const dataProductos = new Set();
    productos.forEach(producto => {
      if (!dataProductos.has(producto.codigo)) {
        dataProductos.add(producto.codigo);
      }
    });
    productos = Array.from(dataProductos).map(codigo => productos.find(producto => producto.codigo === codigo));
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    const elapsedSeconds = Math.round(elapsedTime / 1000).toFixed(2);
    //console.log("Clientes", clientes);
    //console.log("Productos", productos);
    const insertQuery = 'INSERT INTO `usuarios`(`perfil_id`, `ciudad_id`, `usuario`, `contrasena`, `nombre`, `direccion`, `identificaion`, `correo`, `telefono`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    /*clientes.forEach((cliente) => {
        const { nombre, direccion, identificacion, telefono } = cliente;
        bcrypt.hash(identificacion, 10, (err, hash) => {
          if (err) {
            console.error('Error al generar el hash de la contraseña:', err);
            return;
          }
          connection.query(insertQuery, [2, null, identificacion, hash, nombre, direccion, identificacion, null, telefono], (error, results) => {
            if (error) {
              console.error('Error al insertar el producto:', error);
            } else {
              console.log('Producto insertado:', results);
            }
          });
        });
      });*/
    console.log(fileStats);
    console.log("Tiempo estimado de importación: " + elapsedSeconds + " segundos");
    // Elimina el archivo temporal
    await fs.remove('uploads/' + file.name);
    res.render('importarexcel', { data: jsonData || null, clientes: clientes || null, productos: productos || null, fileStats: fileStats || null });
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.post("/logout", async (req, res) => {
  delete req.session.credentials.cliente;
  res.send();
});


router.post("/auth/:username/:password", async (req, res) => {
  console.log("authentication".yellow);
  const query = 'SELECT * FROM usuarios WHERE usuario = ?';
  connection.query(query, [req.params.username], (error, results) => {
    if (error) {
      res.send(error.message);
      callback(error, null);
      return;
    }
    if (results.length === 0) {
      // Usuario no encontrado
      console.log("User not found".red);
      res.send({ message: "Usuario o contraseña icorrectos" });
      return;
    }

    const usuario = results[0];

    // Comparar la contraseña ingresada con la contraseña almacenada utilizando bcrypt
    bcrypt.compare(req.params.password, usuario.contrasena, (err, result) => {
      if (err) {
        console.error('Error al comparar las contraseñas:', err);
        return;
      }
      if (result) {
        req.session.credentials = {
          cliente: results[0],
          administrador: null
        };
        res.send({ message: "Usuario correcto" });
        console.log("Valid username".green);
      } else {
        console.log("Incorrect password".red);
        res.send({ message: "Usuario o contraseña icorrectos" });
      }
    });
  });
});

module.exports = { router, configureSocket };
