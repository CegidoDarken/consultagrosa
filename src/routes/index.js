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
require('datatables.net-bs5');
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
router.get("/perfiladministrador", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("perfiladministrador", { credentials });
});
router.get("/usuarios", async (req, res) => {
  credentials = req.session.credentials.administrador;
  res.render("usuarios", { credentials });
});
router.get("/contactanos", async (req, res) => {
  credentials = req.session.credentials.cliente;
  res.render("contactanos", { credentials });
});
router.get("/detalleproducto", async (req, res) => {
  credentials = req.session.credentials.cliente;
  const productId = req.query.producto;
  console.log(productId);
  res.render("detalleproducto", { credentials });
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
  num_productos = await obtener_num_productos();
  num_clientes = await obtener_num_clientes();
  num_proveedores = await obtener_num_proveedores();
  res.render("panel", { credentials, num_productos, num_clientes, num_proveedores });
});

router.get("/panel", async (req, res) => {
  const sql = "SELECT count(id_producto) AS num_productos FROM productos;";
  connection.query(sql, (error, productos) => {
    if (error) {
      reject(error);
    } else {
      if (productos.length > 0) {
        resolve(productos[0]["num_productos"]);
      } else {
        resolve(null);
      }
    }
  });
});
router.post("/obtener_productos_count", async (req, res) => {
  res.json({ productos: await obtener_productos_count(), usuarios: await obtener_usuarios_count(), proveedores: await obtener_proveedores_count() });
});
async function obtener_productos_count() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT `all_dates`.`year`, `all_dates`.`month`, COUNT(`productos`.`id_producto`) AS `product_count` FROM ( SELECT 2023 AS `year`, 1 AS `month` UNION SELECT 2023, 2 UNION SELECT 2023, 3 UNION SELECT 2023, 4 UNION SELECT 2023, 5 UNION SELECT 2023, 6 UNION SELECT 2023, 7 UNION SELECT 2023, 8 UNION SELECT 2023, 9 UNION SELECT 2023, 10 UNION SELECT 2023, 11 UNION SELECT 2023, 12) AS `all_dates` LEFT JOIN `productos` ON `all_dates`.`year` = YEAR(`productos`.`fecha`) AND `all_dates`.`month` = MONTH(`productos`.`fecha`) GROUP BY `all_dates`.`year`, `all_dates`.`month` ORDER BY `all_dates`.`year`, `all_dates`.`month`;";
    connection.query(sql, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          const productCounts = result.map(item => item.product_count);
          resolve(productCounts);
        } else {
          resolve(null);
        }
      }
    });
  });
}
async function obtener_proveedores_count() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT calendar.year, calendar.month, COUNT(proveedores.id_proveedor) AS provider_count FROM ( SELECT 2023 AS year, 1 AS month UNION SELECT 2023, 2 UNION SELECT 2023, 3 UNION SELECT 2023, 4 UNION SELECT 2023, 5 UNION SELECT 2023, 6 UNION SELECT 2023, 7 UNION SELECT 2023, 8 UNION SELECT 2023, 9 UNION SELECT 2023, 10 UNION SELECT 2023, 11 UNION SELECT 2023, 12) AS calendar LEFT JOIN proveedores ON calendar.year = YEAR(proveedores.fecha) AND calendar.month = MONTH(proveedores.fecha) GROUP BY calendar.year, calendar.month ORDER BY calendar.year, calendar.month;";
    connection.query(sql, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          const productCounts = result.map(item => item.provider_count);
          resolve(productCounts);
        } else {
          resolve(null);
        }
      }
    });
  });
}
async function obtener_usuarios_count() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT calendar.year, calendar.month, COUNT(usuarios.id_usuario) AS user_count FROM (SELECT 2023 AS year, 1 AS month UNION SELECT 2023, 2 UNION SELECT 2023, 3 UNION SELECT 2023, 4 UNION SELECT 2023, 5 UNION SELECT 2023, 6 UNION SELECT 2023, 7 UNION SELECT 2023, 8 UNION SELECT 2023, 9 UNION SELECT 2023, 10 UNION SELECT 2023, 11 UNION SELECT 2023, 12) AS calendar LEFT JOIN usuarios ON calendar.year = YEAR(usuarios.fecha) AND calendar.month = MONTH(usuarios.fecha) AND usuarios.perfil_id = 2 GROUP BY calendar.year, calendar.month ORDER BY calendar.year, calendar.month;";
    connection.query(sql, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          const userCounts = result.map(item => item.user_count);
          resolve(userCounts);
        } else {
          resolve(null);
        }
      }
    });
  });
}
async function obtener_num_clientes() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT count(*) AS num_clientes FROM usuarios where usuarios.perfil_id = 2;";
    connection.query(sql, (error, productos) => {
      if (error) {
        reject(error);
      } else {
        if (productos.length > 0) {
          resolve(productos[0]["num_clientes"]);
        } else {
          resolve(null);
        }
      }
    });
  });
}

async function obtener_num_productos() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT count(*) AS num_productos FROM productos;";
    connection.query(sql, (error, productos) => {
      if (error) {
        reject(error);
      } else {
        if (productos.length > 0) {
          resolve(productos[0]["num_productos"]);
        } else {
          resolve(null);
        }
      }
    });
  });
}
async function obtener_num_proveedores() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT count(*) AS num_proveedores FROM proveedores;";
    connection.query(sql, (error, productos) => {
      if (error) {
        reject(error);
      } else {
        if (productos.length > 0) {
          resolve(productos[0]["num_proveedores"]);
        } else {
          resolve(null);
        }
      }
    });
  });
}
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
  const sql = "SELECT * FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id_categoria  ORDER BY nombre ASC";
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
router.post('/registrar_cliente', (req, res) => {
  const nombre = req.body.nombre;
  const usuario = req.body.usuario;
  const identificacion = req.body.identificacion;
  const telefono = req.body.telefono;
  const email = req.body.email;
  const id_ciudad = req.body.id_ciudad;
  const direccion = req.body.direccion;
  const password = req.body.password;
  const passwordConfirm = req.body['password-confirm'];

  if (password !== passwordConfirm) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }
  const query = 'SELECT * FROM usuarios WHERE usuario = ?';
  connection.query(query, [usuario], (err, results) => {
    if (err) {
      console.error('Error al consultar en la base de datos:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'El usuario ya está registrado' });
    }
  });
  res.status(200).json({ message: 'Registro exitoso' });
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
  const { codigo, tag, categoria, nombre, descripcion, medidas, precio, cantidad, total, img, id_producto } = req.body;
  let sql;
  let values;
  if (img) {
    sql = "UPDATE `productos` SET `codigo`=?,`tag`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medidas`=?, `precio`=?,`cantidad`=?,`total`=?,`img`=? WHERE id_producto=?";
    values = [codigo, tag, categoria, nombre, descripcion, medidas, precio, cantidad, total, img, id_producto];
  } else {
    sql = "UPDATE `productos` SET `codigo`=?,`tag`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medidas`=?, `precio`=?,`cantidad`=?,`total`=? WHERE id_producto=?";
    values = [codigo, tag, categoria, nombre, descripcion, medidas, precio, cantidad, total, id_producto];
  }

  connection.query(sql, values, (error, results) => {
    if (error) {
      console.log(error);
      if (error.message === `Duplicate entry '${codigo}' for key 'productos.unique_codigo'`) {
        res.status(500).json({ error: "Código ya existente" });
      } else if (error.message === `Duplicate entry '${tag}' for key 'productos.tag_UNIQUE'`) {
        res.status(500).json({ error: "Tag ya existente" });
      }
    } else {
      if (results) {
        console.log(id_producto);
        res.json({ message: "Guardado exitosamente" });
      }
    }
  });
});

router.post('/insertar_producto', (req, res) => {
  const currentDate = new Date(Date.now());
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const { codigo, tag, categoria, nombre, descripcion, medidas, precio, cantidad, total, img } = req.body;
  const sql = "INSERT INTO `railway`.`productos`(`codigo`, `tag`,`categoria_id`,`nombre`,`descripcion`,`medidas`,`precio`,`cantidad`,`total`,`img`, `fecha`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
  connection.query(sql, [codigo, tag, categoria, nombre, descripcion, medidas, precio, cantidad, total, img, `${year}-${month}-${day}`], (error, results) => {
    if (error) {
      console.log(error);
      if (error.message === `Duplicate entry '${codigo}' for key 'productos.unique_codigo'`) {
        res.status(500).json({ error: "Código ya existente" });
      } else if (error.message === `Duplicate entry '${tag}' for key 'productos.tag_UNIQUE'`) {
        res.status(500).json({ error: "Tag ya existente" });
      }
    } else {
      if (results) {
        res.json({ message: "Guardado exitosamente" });
      }
    }
  });
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
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id = categorias.id_categoria AND tag = ?";
  connection.query(sql, [tag], (error, results) => {
    if (error) {
      res.send({ message: error.message });
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


router.post("/kardex_saldo", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const { cantidad, precio, total, id_producto, detalle } = req.body;
    let sql;
    sql = "INSERT INTO `kardex` (`producto_id`, `fecha`, `detalle`, `icantidad`, `iunidad`, `itotal`) VALUES (?, ?, ?, ?, ?, ?);";
    connection.query(sql, [id_producto, `${year}-${month}-${day}`, detalle, cantidad, precio, total], (error, insertResult) => {
      if (error) {
        console.log('Error al insertar en el kardex:', error);
        res.status(500).json({ error: "Error al insertar en el kardex" });
      } else {
        res.status(200).json({ message: "Guardado exitosamente" });
      }
    });

  } catch (err) {
    console.log('Error en la solicitud:', err);
    res.status(500).json({ error: "Error en la solicitud" });
  }
});

router.post("/kardex_entrada", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const { cantidad, precio, total, id_producto, detalle } = req.body;

    let sql = "UPDATE railway.productos SET cantidad = cantidad + ?, total = total + ? WHERE id_producto = ?;";
    connection.query(sql, [cantidad, total, id_producto], (error, updateResult) => {
      if (error) {
        console.log('Error al actualizar el producto:', error);
        res.status(500).json({ message: "Error al actualizar el producto" });
      } else if (updateResult.affectedRows === 0) {
        res.status(404).json({ message: "Producto no encontrado" });
      } else {
        sql = "SELECT cantidad, total FROM productos WHERE id_producto = ?;";
        connection.query(sql, [id_producto], (error, selectResult) => {
          if (error) {
            console.error('Error al obtener el resultado de la suma:', error);
            res.status(500).json({ error: "Error al obtener el resultado de la suma" });
          } else {
            sql = "INSERT INTO `kardex` (`producto_id`, `fecha`, `detalle`, `ecantidad`, `eunidad`, `etotal`, `icantidad`, `iunidad`, `itotal`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
            connection.query(sql, [id_producto, `${year}-${month}-${day}`, detalle, cantidad, precio, total, selectResult[0]['cantidad'], precio, selectResult[0]['total']], (error, insertResult) => {
              if (error) {
                console.log('Error al insertar en el kardex:', error);
                res.status(500).json({ error: "Error al insertar en el kardex" });
              } else {
                res.status(200).json({ message: "Guardado exitosamente" });
              }
            });
          }
        });
      }
    });
  } catch (err) {
    console.log('Error en la solicitud:', err);
    res.status(500).json({ error: "Error en la solicitud" });
  }
});
router.post("/kardex_salida", async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const { cantidad, precio, total, id_producto, detalle } = req.body;

    let sql = "UPDATE railway.productos SET cantidad = cantidad - ?, total = total - ? WHERE id_producto = ?;";
    connection.query(sql, [cantidad, total, id_producto], (error, updateResult) => {
      if (error) {
        console.log('Error al actualizar el producto:', error);
        res.status(500).json({ error: "Error al actualizar el producto" });
      } else if (updateResult.affectedRows === 0) {
        res.status(404).json({ error: "Producto no encontrado" });
      } else {
        sql = "SELECT cantidad, total FROM productos WHERE id_producto = ?;";
        connection.query(sql, [id_producto], (error, selectResult) => {
          if (error) {
            console.error('Error al obtener el resultado de la suma:', error);
            res.status(500).json({ error: "Error al obtener el resultado de la suma" });
          } else {
            sql = "INSERT INTO `kardex` (`producto_id`, `fecha`, `detalle`, `scantidad`, `sunidad`, `stotal`, `icantidad`, `iunidad`, `itotal`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
            connection.query(sql, [id_producto, `${year}-${month}-${day}`, detalle, cantidad, precio, total, selectResult[0]['cantidad'], precio, selectResult[0]['total']], (error, insertResult) => {
              if (error) {
                console.log('Error al insertar en el kardex:', error);
                res.status(500).json({ error: "Error al insertar en el kardex" });
              } else {
                res.status(200).json({ message: "Guardado exitosamente" });
              }
            });
          }
        });
      }
    });
  } catch (err) {
    console.log('Error en la solicitud:', err);
    res.status(500).json({ error: "Error en la solicitud" });
  }
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
async function obtener_productos_count() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT `all_dates`.`year`, `all_dates`.`month`, COUNT(`productos`.`id_producto`) AS `product_count` FROM ( SELECT 2023 AS `year`, 1 AS `month` UNION SELECT 2023, 2 UNION SELECT 2023, 3 UNION SELECT 2023, 4 UNION SELECT 2023, 5 UNION SELECT 2023, 6 UNION SELECT 2023, 7 UNION SELECT 2023, 8 UNION SELECT 2023, 9 UNION SELECT 2023, 10 UNION SELECT 2023, 11 UNION SELECT 2023, 12) AS `all_dates` LEFT JOIN `productos` ON `all_dates`.`year` = YEAR(`productos`.`fecha`) AND `all_dates`.`month` = MONTH(`productos`.`fecha`) GROUP BY `all_dates`.`year`, `all_dates`.`month` ORDER BY `all_dates`.`year`, `all_dates`.`month`;";
    connection.query(sql, (error, productos) => {
      if (error) {
        reject(error);
      } else {
        if (productos.length > 0) {
          const productCounts = productos.map(item => item.product_count);
          resolve(productCounts);
        } else {
          resolve(null);
        }
      }
    });
  });
}


router.get("/logoutcliente", async (req, res) => {
  delete req.session.credentials.cliente;
  res.redirect("back");
});

router.get("/logoutadministrador", async (req, res) => {
  delete req.session.credentials.administrador;
  res.redirect("/admin");
});
router.get('/carrito', (req, res) => {
  // Realiza la consulta a la base de datos para obtener los datos del carrito
  connection.query('SELECT * FROM carrito', (err, results) => {
    if (err) {
      console.error('Error al obtener los datos del carrito:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    console.log(results);
    // Devuelve los datos del carrito como respuesta JSON
    res.json(results);
  });
});

router.post("/validar_cliente", async (req, res) => {
  console.log("Authentication".yellow);
  const { usuario, password } = req.body
  const query = 'SELECT *FROM `usuarios`LEFT JOIN `perfiles` ON `perfil_id` = `perfiles`.`id_perfil` LEFT JOIN `ciudades` ON `ciudad_id` = `ciudades`.`id_ciudad` LEFT JOIN `provincias` ON `ciudades`.`provincia_id` = `provincias`.`id_provincia` WHERE `usuarios`.`usuario` = ?;';
  connection.query(query, [usuario], (error, results) => {
    if (error) {
      res.send(error.message);
      callback(error, null);
      return;
    }
    if (results[0] == null) {
      console.log("User not found".red);
      res.status(400).json({ error: "Usuario y/o contraseña incorrrectos" });
      return;
    } else {
      const usuario = results[0];
      bcrypt.compare(password, usuario.contrasena, (err, match) => {
        if (match) {
          req.session.credentials = {
            cliente: usuario,
            administrador: req.session.credentials.administrador
          };
          res.send({ message: "Usuario Correcto" });
        } else {
          res.status(400).json({ error: "Usuario y/o contraseña incorrrectos" });
        }
      });
    }
  });
});

router.post("/validar_administrador", async (req, res) => {
  console.log("Authentication".yellow);
  const { usuario, contrasena } = req.body
  const query = 'SELECT *FROM `usuarios`LEFT JOIN `perfiles` ON `perfil_id` = `perfiles`.`id_perfil` LEFT JOIN `ciudades` ON `ciudad_id` = `ciudades`.`id_ciudad` LEFT JOIN `provincias` ON `ciudades`.`provincia_id` = `provincias`.`id_provincia` WHERE `usuarios`.`usuario` = ?';
  connection.query(query, usuario, (error, results) => {
    if (error) {
      res.send(error.message);
      callback(error, null);
      return;
    }
    if (results[0] == null) {
      console.log("User not found".red);
      res.status(400).json({ error: "Usuario y/o contraseña incorrrectos" });
      return;
    } else {
      const usuario = results[0];
      bcrypt.compare(contrasena, usuario.contrasena, (err, match) => {
        if (err) {
          res.status(400).json({ error: "Usuario y/o contraseña incorrrectos" });
          return;
        }
        if (match) {
          req.session.credentials = {
            cliente: req.session.credentials.cliente,
            administrador: usuario
          };
          console.log("Correct user".green);
          res.status(200).json({ message: "Usuario correcto" });
        } else {
          console.log("Password does not match ".red);
          res.status(400).json({ error: "Usuario y/o contraseña incorrrectos" });
        }
      });
    }
  });
});
module.exports = { router, configureSocket };
