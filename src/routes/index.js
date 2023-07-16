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
router.get("/contactanos", async (req, res) => {
  credentials = req.session.credentials.cliente;
  res.render("contactanos", { credentials });
});
router.get("/acerca", async (req, res) => {
  credentials = req.session.credentials.cliente;
  res.render("acerca", { credentials });
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
  const sql = "SELECT * FROM productos,categorias, rfid_tags WHERE productos.categoria_id = categorias.id_categoria AND productos.tag_id = rfid_tags.id_tag AND tag != ''";
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
router.get("/kardex", async (req, res) => {
  credentials = req.session.credentials.administrador;
  const sql = "SELECT * FROM productos ORDER BY nombre ASC";
  connection.query(sql, (error, productos) => {
    if (error) {
      res.render("kardex", { credentials, productos: error.message });
    } else {
      if (productos.length > 0) {
        res.render("kardex", { credentials, productos });
      } else {
        res.render("kardex", { credentials, productos: null });
      }
    }
  });
});
router.post("/obtener_inventario", async (req, res) => {
  const sql = "SELECT * FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id_categoria LEFT JOIN rfid_tags ON productos.tag_id = rfid_tags.id_tag ORDER BY nombre ASC";
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
router.post("/obtener_tags", async (req, res) => {
  const sql = "SELECT * FROM rfid_tags;";
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
router.post("/asignar_producto", async (req, res) => {
  const { tag, idproducto } = req.body;
  console.log(tag, idproducto);
  const date = new Date().toISOString().slice(0, 19).replace("T", " ");
  const sql = "INSERT INTO `rfid_tags` (`tag`, `fecha_registro`, `estado`) VALUES(?, ?, ?)";
  connection.query(sql, [tag, date, 1], (error, result) => {
    if (error) {
      res.json({ data: error.message });
      console.error(error);
    } else {
      if (result.affectedRows > 0) {
        const sql = "UPDATE `railway`.`productos` SET `tag_id` = ? WHERE `id_producto` = ?;";
        connection.query(sql, [result.insertId, idproducto], (error, results) => {
          if (error) {
            console.error(error);
            res.json({ message: error });
          } else {
            if (results) {
              res.json({ message: "Success" });
            }
          }
        });
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

router.post("/obtener_provincias", async (req, res) => {
  const sql = "SELECT * FROM provincias";
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

router.post("/obtener_kardex", async (req, res) => {
  const id_producto = req.body.id_producto;
  const sql = "SELECT * FROM kardex WHERE producto_id = ?";
  connection.query(sql, [id_producto], (error, result) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res.json({ data: result });
    }
  });
});
router.post("/obtener_ciudades", async (req, res) => {
  const provinciaId = req.body.provinciaId;

  const sql = "SELECT * FROM ciudades WHERE provincia_id = ?";
  connection.query(sql, [provinciaId], (error, result) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      if (result.length > 0) {
        res.json({ data: result });
      } else {
        res.json({ data: null });
      }
    }
  });
});
router.post("/obtener_perfiles", async (req, res) => {
  const sql = "SELECT * FROM perfiles";
  connection.query(sql, (error, result) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      if (result.length > 0) {
        res.json({ data: result });
      } else {
        res.json({ data: null });
      }
    }
  });
});
router.post("/obtener_productos", async (req, res) => {
  const sql = "SELECT * FROM productos";
  connection.query(sql, (error, result) => {
    if (error) {
      res.status(500).json({ error: error.message });
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
  const { codigo, categoria, nombre, descripcion, medidas, precio, descuento, preciodesc, cantidad, total, img, idproducto } = req.body;
  if (img) {
    const sql = "UPDATE `productos` SET `codigo`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medidas`=?, `precio`=?,`descuento`=?,`preciodesc`=?, `cantidad`=?, `total`=?, `img`=? WHERE id_producto=?";
    connection.query(sql, [codigo, categoria, nombre, descripcion, medidas, precio, descuento, preciodesc, cantidad, total, img, idproducto], (error, results) => {
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
    const sql = "UPDATE `productos` SET `codigo`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medidas`=?, `precio`=?,`descuento`=?,`preciodesc`=?, `cantidad`=?, `total`=? WHERE id_producto=?";
    connection.query(sql, [codigo, categoria, nombre, descripcion, medidas, precio, descuento, preciodesc, cantidad, total, idproducto], (error, results) => {
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

router.post('/insert_producto', (req, res) => {
  const { codigo, categoria, nombre, descripcion, medidas, precio, descuento, preciodesc, cantidad, total, img } = req.body;
  if (img) {
    const sql = "INSERT INTO `railway`.`productos`(`codigo`,`categoria_id`,`nombre`,`descripcion`,`medidas`,`precio`,`descuento`,`preciodesc`,`cantidad`,`total`,`img`)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    connection.query(sql, [codigo, categoria, nombre, descripcion, medidas, precio, descuento, preciodesc, cantidad, total, img], (error, results) => {
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
    const sql = "INSERT INTO `railway`.`productos`(`codigo`,`categoria_id`,`nombre`,`descripcion`,`medidas`,`precio`,`descuento`,`preciodesc`,`cantidad`,`total`,`img`)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    connection.query(sql, [codigo, categoria, nombre, descripcion, medidas, precio, descuento, preciodesc, cantidad, total], (error, results) => {
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

router.post('/delete_producto', (req, res) => {
  const idProducto = req.body.idproducto;
  console.log(idProducto);
  const sql = "DELETE FROM `productos` WHERE id_producto = ?";
  connection.query(sql, [idProducto], (error, results) => {
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
  const sql = "SELECT * FROM productos,categorias, rfid_tags WHERE productos.categoria_id = categorias.id_categoria AND productos.tag_id = rfid_tags.id_tag AND tag = ?";
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


router.get("/logoutcliente", async (req, res) => {
  delete req.session.credentials.cliente;
  res.redirect("back");
});

router.get("/logoutadministrador", async (req, res) => {
  delete req.session.credentials.administrador;
  res.redirect("/admin");
});
router.post("/validar_cliente", async (req, res) => {
  console.log("Authentication".yellow);
  const { usuario, password } = req.body
  const query = 'SELECT * FROM usuarios, perfiles WHERE usuario = ? AND usuarios.perfil_id = perfiles.id_perfil AND perfil_id = 2';
  connection.query(query, [usuario], (error, results) => {
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
      bcrypt.compare(password, usuario.contrasena, (err, match) => {
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
