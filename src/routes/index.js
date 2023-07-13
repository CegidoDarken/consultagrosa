const express = require('express');
const { Server } = require('socket.io');
const router = express.Router();
const bcrypt = require('bcrypt');
const { connection } = require('../database');
const XLSX = require('xlsx');
const fs = require('fs-extra');
const mime = require('mime-types');
const NodeCache = require('node-cache');
const cache = new NodeCache();
let io;
function configureSocket(server) {
  io = new Server(server);
  io.setMaxListeners(0);
}
router.get("/", async (req, res) => {
  if (req.session.credentials == null) {
    req.session.credentials = {
      cliente: null,
      administrador: null
    };
  }
  const query = 'SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria';
  connection.query(query, async (error, results) => {
    if (error) {
      res.send(error.message);
      callback(error, null);
      return;
    }
    res.render("index", { credentials: req.session.credentials.cliente, results });
  });
});

router.get("/admin", async (req, res) => {
  if (req.session.credentials == null) {
    req.session.credentials = {
      cliente: null,
      administrador: null
    };
  }
  if (req.session.credentials.administrador) {
    res.redirect("/panel");
  } else {
    res.render("admin");
  }
});

router.get("/pedidos", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("pedidos", { credentials });
});
router.get("/usuarios", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("usuarios", { credentials });
});
router.get("/test", async (req, res) => {
  res.render("test");
});
router.get("/analisis", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("analisis", { credentials });
});
router.get("/escanear", async (req, res) => {
  credentials = req.session.credentials.administrador;
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id = categorias.id_categoria AND tag != ''";
  connection.query(sql, (error, results) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (results) {
        res.render("escanear", { credentials, productos: results });
      } else {
        res.send({ message: "Producto no reconocido" });
      }
    }
  });
});
router.get("/panel", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("panel", { credentials });
});
router.get("/kardex", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("kardex", { credentials });
});

router.get("/inventario", async (req, res) => {
  credentials = req.session.credentials.administrador;
  const sql = "SELECT * FROM categorias ORDER BY categoria ASC";
  connection.query(sql, (error, categorias) => {
    if (error) {
      res.render("inventario", { credentials, categorias: error.message });
    } else {
      if (categorias.length > 0) {
        res.render("inventario", { credentials, categorias });
      } else {
        res.render("inventario", { credentials, categorias: null });
      }
    }
  });
});
router.post("/obtener_inventario", async (req, res) => {
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria ORDER BY nombre ASC";
  connection.query(sql, (error, productos) => {
    if (error) {
      res.json({ data: error.message });
    } else {
      productos.forEach(element => {
        if (element.img) {
          element.img = element.img.toString();
        }
      });
      if (productos.length > 0) {
        res.json({ data: productos });
      } else {
        res.json({ data: null });
      }
    }
  });
});
router.post("/obtener_inventario_total", async (req, res) => {
  const sql = "SELECT count(id_producto) FROM railway.productos;";
  connection.query(sql, (error, total) => {
    if (error) {
      res.json({ data: error.message });
    } else {
      if (productos.length > 0) {
        res.json({ data: total });
      } else {
        res.json({ data: null });
      }
    }
  });
});
router.post("/obtener_usuarios", async (req, res) => {
  const sql = "SELECT * FROM usuarios INNER JOIN perfiles ON usuarios.perfil_id = perfiles.id_perfil LEFT JOIN ciudades ON usuarios.ciudad_id = ciudades.id_ciudad LEFT JOIN provincias ON ciudades.provincia_id = provincias.id_provincia";
  connection.query(sql, (error, result) => {
    if (error) {
      res.json({ data: error.message });
    } else {
      if (result.length > 0) {
        res.json({ data: result });
      } else {
        res.json({ data: null });
      }
    }
  });
});

router.post('/carrito', (req, res) => {
  const { id } = req.body;
  const carrito = cache.get('carrito') || [];
  carrito.push(id);
  cache.set('carrito', carrito);
  console.log(cache.get('carrito'));
  res.send('Producto agregado al carrito');
});

router.post('/update_producto', (req, res) => {
  const { codigo, categoria, nombre, descripcion, precio, descuento, preciodesc, cantidad, total, img, idproducto } = req.body;
  if (img) {
    const sql = "UPDATE `productos` SET `codigo`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`precio`=?,`descuento`=?,`preciodesc`=?, `cantidad`=?, `total`=?, `img`=? WHERE id_producto=?";
    connection.query(sql, [codigo, categoria, nombre, descripcion, precio, descuento, preciodesc, cantidad, total, img, idproducto], (error, results) => {
      if (error) {
        console.log(error);
        res.json({ message: error });
      } else {
        if (results) {
          res.json({ message: "Success" });
        } else {
          res.json({ message: "No found" });
        }
      }
    });
  } else {
    const sql = "UPDATE `productos` SET `codigo`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`precio`=?,`descuento`=?,`preciodesc`=?, `cantidad`=?, `total`=? WHERE id_producto=?";
    connection.query(sql, [codigo, categoria, nombre, descripcion, precio, descuento, preciodesc, cantidad, total, idproducto], (error, results) => {
      if (error) {
        console.log(error);
        res.json({ message: error });
      } else {
        if (results) {
          res.json({ message: "Success" });
        } else {
          res.json({ message: "No found" });
        }
      }
    });
  }
});
router.post('/eliminar_producto', (req, res) => {
  const { idproducto, cantidad, total } = req.body;
  const sql = "INSERT INTO `kardex` (`producto_id`,`fecha`,`tipo_mov`,`cantidad`,`precio_total`) VALUES(?, ?, ?, ?, ?);";
  connection.query(sql, [idproducto, Date(), "salida", cantidad, total], (error, results) => {
    if (error) {
      console.log(error);
      res.send({ message: error });
    } else {
      if (results) {
        res.send({ message: "Success" });
      } else {
        res.send({ message: "No found" });
      }
    }
  });
});
router.post('/insertar_salida', (req, res) => {
  const { idproducto, cantidad, total } = req.body;
  const sql = "INSERT INTO `kardex` (`producto_id`,`fecha`,`tipo_mov`,`cantidad`,`precio_total`) VALUES(?, ?, ?, ?, ?);";
  connection.query(sql, [idproducto, Date(), "salida", cantidad, total], (error, results) => {
    if (error) {
      console.log(error);
      res.send({ message: error });
    } else {
      if (results) {
        res.send({ message: "Success" });
      } else {
        res.send({ message: "No found" });
      }
    }
  });
});

router.post("/buscarproductotag", async (req, res) => {
  const { tag } = req.body;
  console.log(tag);
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria AND tag = ?";
  connection.query(sql, [tag], (error, results) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (results.length > 0) {
        results[0].img = results[0].img.toString();
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
        try {
          results[0].img = results[0].img.toString();
        } catch (error) {
          console.log(error);
        }
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
      if (results) {
        res.send(results[0]);
      } else {
        res.send({ message: "Producto no reconocido" });
      }
    }
  });
});


router.get("/logoutclient", async (req, res) => {
  delete req.session.credentials.cliente;
  res.redirect("/admin");
});

router.get("/logoutadmin", async (req, res) => {
  delete req.session.credentials.administrador;
  res.redirect("/admin");
});
router.post("/authclient/:username/:password", async (req, res) => {
  console.log("Authentication".yellow);
  const query = 'SELECT * FROM usuarios, perfiles WHERE usuario = ? AND usuarios.perfil_id = perfiles.id_perfil AND perfil_id = 2';
  connection.query(query, [req.params.username], (error, results) => {
    if (error) {
      res.send(error.message);
      callback(error, null);
      return;
    }
    if (results[0] == null) {
      console.log("User not found".red);
      res.send({ message: "Wrong" });
      return;
    } else {
      const usuario = results[0];
      bcrypt.compare(req.params.password, usuario.contrasena, (err, match) => {
        if (err) {
          console.error('Error:', err.message);
          res.send({ message: err.message });
          return;
        }
        if (match) {
          req.session.credentials = {
            cliente: usuario,
            administrador: req.session.credentials.administrador
          };
          console.log("Correct user".green);
          res.send({ message: "Pass" });
        } else {
          console.log("Password does not match ".red);
          res.send({ message: "Wrong" });
        }
      });
    }
  });
});

router.post("/authadmin/:username/:password", async (req, res) => {
  console.log("Authentication".yellow);
  const query = 'SELECT * FROM usuarios, perfiles WHERE usuario = ? AND usuarios.perfil_id = perfiles.id_perfil AND perfil_id = 1';
  connection.query(query, [req.params.username], (error, results) => {
    if (error) {
      res.send(error.message);
      callback(error, null);
      return;
    }
    if (results[0] == null) {
      console.log("User not found".red);
      res.send({ message: "Wrong" });
      return;
    } else {
      const usuario = results[0];
      bcrypt.compare(req.params.password, usuario.contrasena, (err, match) => {
        if (err) {
          console.error('Error:', err.message);
          res.send({ message: err.message });
          return;
        }
        if (match) {
          req.session.credentials = {
            cliente: req.session.credentials.cliente,
            administrador: usuario
          };
          console.log("Correct user".green);
          res.send({ message: "Pass" });
        } else {
          console.log("Password does not match ".red);
          res.send({ message: "Wrong" });
        }
      });
    }
  });
});
module.exports = { router, configureSocket };
