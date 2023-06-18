const express = require('express');
const { parse } = require('path')
const { Server } = require('socket.io');
const router = express.Router();
const bcrypt = require('bcrypt');
const { connection } = require('../database');
const NodeCache = require('node-cache');
const chache = new NodeCache();
const session = require('express-session');
let io;
function configureSocket(server) {
  io = new Server(server);
  io.setMaxListeners(0);
}
session.credentials = {
  cliente: null,
  administrador: null
};
router.get("/", async (req, res) => {
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

router.get("/admin", async (req, res) => {
  if (req.session.credentials.administrador) {
    credentials = req.session.credentials.administrador;
    res.redirect("/panel");
  } else {
    res.render("admin");
  }
});

router.get("/pedidos", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("pedidos", { credentials });
});
router.get("/analisis", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("analisis", { credentials });
});
router.get("/escanearproducto", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("escanearproducto", { credentials });
});
router.get("/panel", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("panel", { credentials });
});
router.get("/kardex", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("kardex", { credentials });
});

router.get("/adminproducto", async (req, res) => {
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria";
  connection.query(sql, (error, results) => {
    if (error) {
      res.render("adminproducto", { productos: error.message });
    } else {
      if (results.length > 0) {
        res.render("adminproducto", { productos: results });
      } else {
        res.render("adminproducto", { productos: null });
      }
    }
  });
});

router.post('/carrito', (req, res) => {
  const { producto } = req.body;
  const carrito = cache.get('carrito') || [];
  carrito.push(producto);
  cache.set('carrito', carrito);

  res.send('Producto agregado al carrito');
});

router.post("/buscarproductotag", async (req, res) => {
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria AND tag = ?";
  connection.query(sql, [req.body.tag], (error, results) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (results.length > 0) {
        res.send(results[0]);
      } else {
        res.send({ message: "Producto no reconocido" });
      }
    }
  });
});

router.post("/buscarproductoid", async (req, res) => {
  const { id } = req.body;
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria AND id_producto = ?";
  connection.query(sql, [id], (error, results) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (results.length > 0) {
        res.send(results[0]);
      } else {
        res.send({ message: "Producto no reconocido" });
      }
    }
  });
});

router.post("/productos", async (req, res) => {
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria";
  connection.query(sql, (error, results) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (results.length > 0) {
        res.send(results[0]);
      } else {
        res.send({ message: "Producto no reconocido" });
      }
    }
  });
});


router.post("/logoutclient", async (req, res) => {
  delete req.session.credentials.cliente;
  res.send();
});

router.post("/logoutadmin", async (req, res) => {
  delete req.session.credentials.administrador;
  res.send();
});
router.post("/authclient/:username/:password", async (req, res) => {
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
          cliente: usuario,
          administrador: req.session.credentials.administrador
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

router.post("/authadmin/:username/:password", async (req, res) => {
  console.log("authentication".yellow);
  const query = 'SELECT * FROM usuarios WHERE usuario = ? AND perfil_id = 1';
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
          cliente: req.session.credentials.cliente,
          administrador: usuario
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
