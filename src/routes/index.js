const express = require('express');
const { Server } = require('socket.io');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { connection } = require('../database');
require('datatables.net-bs5');
let io;
function configureSocket(server) {
  io = new Server(server);
  io.setMaxListeners(0);
}
var apriori = require("node-apriori");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "consultagrosaprueba@gmail.com",
    pass: "oyzqvyofgutbpdev",
  },
});

//TODO: Rutas
router.get("/tienda", async (req, res) => {
  res.render("tienda", { credentials: req.session.credentials ? req.session.credentials.cliente : null, productos: await obtener_productos() });
});

router.get("/admin", async (req, res) => {
  if (req.session.credentials.administrador) {
    return res.redirect("/dashboard");
  }
  return res.render("admin");
});

router.get("/validar", async (req, res) => {
  const { usuario } = req.query;
  const updateQuery = `UPDATE usuarios SET estado = 1 WHERE id_usuario = ?`;
  connection.query(updateQuery, [usuario], (error, result) => {
    if (error) {
      return res.render("validar", { type: "error", message: "Error al actualizar el estado del usuario: " + error, data: null });
    }
    return res.render("validar", { type: "success", message: "Cuenta validada exitosamente", data: null });
  });
});
router.get("/recuperar", async (req, res) => {
  const { usuario } = req.query;
  return res.render("recuperar", { usuario });
});
router.get("/perfiladministrador", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("perfiladministrador", { credentials });
});
router.get("/usuarios", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("usuarios", { credentials });
});
router.get("/contactanos", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.cliente : null;
  res.render("contactanos", { credentials });
});
router.get("/detalleproducto", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.cliente : null;
  const { producto } = req.query;
  let productos_recomendado = [];
  let array = await aprioris(producto);
  for (const element of array) {
    const producto_id = await obtener_producto_id(element);
    productos_recomendado.push(producto_id);
  }
  res.render("detalleproducto", { credentials, producto: await obtener_producto_id(producto), recomendados: productos_recomendado });
});

router.post('/recuperar', async (req, res) => {
  const { correo } = req.body;
  const sql = 'SELECT * FROM usuarios WHERE correo = ?';
  connection.query(sql, [correo], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ type: 'error', message: 'Error en la base de datos', data: null });
    } else {
      if (results.length === 0) {
        res.status(404).json({ type: 'error', message: 'Usuario no valido', data: null });
      } else {
        const enlace = `https://consultagrosa-production.up.railway.app/recuperar?usuario=${encodeURIComponent(results[0].id_usuario)}`;
        var mailOptions = {
          form: 'consultagrosaprueba@gmail.com',
          to: correo,
          subject: 'Recuperacion de contraseña',
          text: `Para crear una nueva contraseña, haz clic en el siguiente enlace: ${enlace}`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.status(500).json({ type: 'error', message: 'Error al enviar el correo', data: null });
          } else {
            res.status(200).json({ type: 'success', message: 'Correo enviado correctamente', data: null });
          }
        });
      }
    }
  });
});

async function aprioris(producto) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT GROUP_CONCAT(`detallepedidos`.`producto_id` SEPARATOR ',') AS `productos` FROM `pedidos` INNER JOIN `detallepedidos` ON `pedidos`.`id_pedido` = `detallepedidos`.`pedido_id` WHERE `pedidos`.`id_pedido` IN (SELECT DISTINCT `detallepedidos`.`pedido_id` FROM `detallepedidos` WHERE `detallepedidos`.`producto_id` = ?) GROUP BY `pedidos`.`id_pedido`, `pedidos`.`usuario_id`, `pedidos`.`fecha`, `pedidos`.`total`;";
    connection.query(sql, [producto], (error, results) => {
      if (error) {
        res.json({ message: error });
      } else {
        if (results) {
          let productos = [];
          let productos_recomendado = [];
          results.forEach(elements => {
            productos.push(elements.productos.split(","));
          });
          var aprioriAlgo = new apriori.Apriori(0.1);
          aprioriAlgo.exec(productos)
            .then(function (result) {
              var frequentItemsets = result.itemsets;
              var recommendations = generateRecommendations(frequentItemsets);
              for (const element of recommendations) {
                if (element !== producto) {
                  productos_recomendado.push(element);
                }
              }
              resolve(productos_recomendado);
            });
          function generateRecommendations(itemsets) {
            itemsets.sort(function (a, b) {
              return b.support - a.support;
            });
            var recommendations = [];
            var recommendationSet = new Set();
            for (var i = 0; i < itemsets.length; i++) {
              var itemset = itemsets[i];
              if (itemset.items.length > 0 && !recommendationSet.has(itemset.items[0])) {
                recommendations.push(itemset.items[0]);
                recommendationSet.add(itemset.items[0]);
              }
            }

            return recommendations;
          }
        } else {
          res.json({ message: "Producto no reconocido" });
        }
      }
    })
  });
}

router.post('/agregar_carrito', async (req, res) => {
  const { usuario_id, producto_id, cantidad_deseada, precio } = req.body;
  connection.query(
    'SELECT cantidad, total FROM carritos WHERE producto_id = ? AND usuario_id = ? LIMIT 1',
    [producto_id, usuario_id],
    async (err, cartResults) => {
      if (err) {
        return res.status(500).json({ type: "error", message: 'Error al obtener la información del carrito: ' + err, data: null });
      }
      let cantidad_actual = 0;
      if (cartResults.length !== 0) {
        cantidad_actual = cartResults[0].cantidad;
      }
      const nueva_cantidad = parseInt(cantidad_actual) + parseInt(cantidad_deseada);
      connection.query(
        'SELECT cantidad FROM productos WHERE id_producto = ?',
        [producto_id],
        (err, productResults) => {
          if (err) {
            return res.status(500).json({ type: "error", message: 'Error al obtener la información del producto: ' + err, data: null });
          }

          if (productResults.length === 0) {
            return res.status(404).json({ type: "error", message: 'Producto no encontrado', data: null });
          }

          const cantidad_disponible = productResults[0].cantidad;

          if (nueva_cantidad > cantidad_disponible) {
            return res.status(400).json({ type: "error", message: 'Cantidad disponible', data: null });
          }
          if (nueva_cantidad < 1) {
            return res.status(400)
          }
          if (cartResults.length === 0) {
            connection.query(
              'INSERT INTO carritos (producto_id, usuario_id, cantidad, total) VALUES (?, ?, ?, ?)',
              [producto_id, usuario_id, cantidad_deseada, cantidad_deseada * precio],
              (err, insertResult) => {
                if (err) {
                  console.error('Error al insertar el producto en el carrito: ', err);
                  return res.status(500).json({ type: "error", message: 'Error al insertar el producto en el carrito: ' + err, data: null });
                }
                return res.status(200).json({ type: "success", message: 'Producto agregado al carrito', data: null });
              }
            );
          } else {
            const { cantidad, total } = cartResults[0];
            const newCantidad = parseInt(cantidad) + parseInt(cantidad_deseada);
            const newTotal = parseInt(total) + parseInt(cantidad_deseada) * parseInt(precio);
            connection.query(
              'UPDATE carritos SET cantidad = ?, total = ? WHERE producto_id = ? AND usuario_id = ?',
              [newCantidad, newTotal, producto_id, usuario_id],
              (err, updateResult) => {
                if (err) {
                  return res.status(500).json({ type: "error", message: 'Error al insertar el producto en el carrito: ' + err, data: null });
                }
              }
            );
          }
        }
      );
    }
  );
});

router.get("/", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.cliente : null;
  res.render("index", { credentials });
});
router.get("/test", async (req, res) => {
  res.render("test");
});
router.get("/analisis", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("analisis", { credentials });
});
router.get("/escanear", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id = categorias.id_categoria AND tag != ''";
  connection.query(sql, (error, productos) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (productos) {
        res.render("escanear", { credentials, productos });
      } else {
        res.send({ message: "Producto no reconocido" });
      }
    }
  });
});

router.post("/obtener_pedidos", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  const sql = "SELECT dp.`id_detalle_pedido`, dp.`pedido_id`, dp.`estado`, dp.`producto_id`, dp.`cantidad`, dp.`total` AS 'total_detalle', p.`id_pedido`, p.`usuario_id`, p.`fecha`, p.`total` AS 'total_pedido', pr.`nombre` AS 'nombre_producto', dp.`precio`, u.`nombre` AS 'nombre_usuario', u.`correo` AS 'email_usuario' FROM `detallepedidos` AS dp JOIN `pedidos` AS p ON dp.`pedido_id` = p.`id_pedido` JOIN `productos` AS pr ON dp.`producto_id` = pr.`id_producto` JOIN `usuarios` AS u ON p.`usuario_id` = u.`id_usuario` ORDER BY dp.`id_detalle_pedido` DESC;";
  connection.query(sql, (error, results) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (results) {
        res.json({ data: results });
      } else {
        res.json({ message: "Producto no reconocido" });
      }
    }
  });
});
router.post("/realizar_pedidos", async (req, res) => {
  const { id_usuario, total, pedidos } = req.body;
  const fechaActual = new Date().toISOString();
  const dateObject = new Date(fechaActual);
  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, '0');
  const day = String(dateObject.getDate()).padStart(2, '0');
  const formattedDate = `${year}/${month}/${day}`;

  try {
    const insertPedidoQuery = `
      INSERT INTO railway.pedidos
      (usuario_id, fecha, total)
      VALUES (?, ?, ?)
    `;

    const insertDetallePedidoQuery = `
      INSERT INTO railway.detallepedidos
      (pedido_id, producto_id, precio, cantidad, total, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const pedidoResult = await new Promise((resolve, reject) => {
      connection.query(insertPedidoQuery, [id_usuario, formattedDate, total], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    const pedidoId = pedidoResult.insertId;

    for (const pedido of pedidos) {
      const { id_producto, precio, cantidad } = pedido;
      await new Promise((resolve, reject) => {
        connection.query(insertDetallePedidoQuery, [pedidoId, id_producto, precio, cantidad, (cantidad * precio), "Pendiente"], (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    res.status(200).json({ message: 'Pedidos creados exitosamente.' });
  } catch (error) {
    console.error('Error creating orders:', error);
    res.status(500).json({ error: 'Error al crear los pedidos.' });
  }
});


router.post("/obtener_cantidad_carrito", async (req, res) => {
  const id_usuario = req.body.id_usuario;
  const sql = "SELECT COUNT(*) as cantidad FROM carritos WHERE usuario_id = ?;";
  connection.query(sql, [id_usuario], (error, results) => {
    if (error) {
      res.send({ message: error });
    } else {
      if (results) {
        res.json({ data: results });
      } else {
        res.json({ message: "Producto no reconocido" });
      }
    }
  });
});
router.get("/pedidos", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("pedidos", { credentials });
});
router.get("/dashboard", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  num_productos = await obtener_num_productos();
  num_clientes = await obtener_num_clientes();
  num_proveedores = await obtener_num_proveedores();
  res.render("dashboard", { credentials, num_productos, num_clientes, num_proveedores });
});

router.get("/dashboard", async (req, res) => {
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
  let anio = req.body.anio;
  res.json({ productos: await obtener_productos_count(anio), usuarios: null, proveedores: await obtener_proveedores_count() });
});
async function obtener_productos_count(anio) {
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
router.post("/obtener_mas_pedidos", async (req, res) => {
  const anio = req.body.anio;
  res.json({ productos: await obtener_mas_pedidos(anio) });
});
async function obtener_mas_pedidos(anio) {

  return new Promise((resolve, reject) => {
    const sql = "SELECT p.img, p.nombre, p.precio, SUM(d.cantidad) AS vendidos, SUM(d.cantidad * p.precio) AS ganancias FROM productos p INNER JOIN detallepedidos d ON p.id_producto = d.producto_id WHERE YEAR(p.fecha) = ? GROUP BY p.id_producto ORDER BY vendidos DESC LIMIT 6;";
    connection.query(sql, [anio], (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          result.forEach(element => {
            if (element.img) {
              element.img = element.img.toString();
            }
          });
          resolve(result);
        } else {
          resolve(null);
        }
      }
    });
  });
}

router.post("/obtener_recientes", async (req, res) => {
  res.json({ productos: await obtener_recientes() });
});
async function obtener_recientes() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT `pedidos`.`id_pedido`, `usuarios`.`nombre` AS `cliente`, `productos`.`nombre` AS `producto`, `productos`.`precio`, pedidos.`estado` FROM `pedidos` JOIN `detallepedidos` ON `pedidos`.`id_pedido` = `detallepedidos`.`pedido_id` JOIN `productos` ON `detallepedidos`.`producto_id` = `productos`.`id_producto` JOIN `usuarios` ON `pedidos`.`usuario_id` = `usuarios`.`id_usuario` ORDER BY `pedidos`.`fecha` DESC LIMIT 10;";
    connection.query(sql, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          result.forEach(element => {
            if (element.img) {
              element.img = element.img.toString();
            }
          });
          resolve(result);
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
router.get("/productos", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  const sql = "SELECT * FROM categorias ORDER BY categoria ASC";
  connection.query(sql, (error, categorias) => {
    if (error) {
      res.render("productos", { credentials, categorias: error.message });
    } else {
      if (categorias.length > 0) {
        res.render("productos", { credentials, categorias });
      } else {
        res.render("productos", { credentials, categorias: null });
      }
    }
  });
});
router.get("/kardex", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
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
        const sql = "UPDATE `productos` SET `tag_id` = ? WHERE `id_producto` = ?;";
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
  const { ciudad, usuario, contrasena, direccion, identificacion, nombre, correo, telefono } = req.body;
  bcrypt.hash(contrasena, 10, (error, hash) => {
    if (error) {
      res.status(500).json({ type: "error", message: error.message, data: null });
    } else {
      const currentDate = new Date(Date.now());
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const sql = "INSERT INTO `usuarios` (`perfil_id`, `ciudad_id`, `usuario`, `contrasena`, `nombre`, `direccion`, `identificacion`, `correo`, `telefono`, `fecha`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
      connection.query(sql, [2, ciudad, usuario, hash, nombre, direccion, identificacion, correo, telefono, `${year}-${month}-${day}`], (error, results) => {
        if (error) {
          console.log(error);
          if (error.message.includes("usuario_UNIQUE")) {
            res.status(500).json({ type: "error", message: "Usuario ya registrado", data: null });
          } else if (error.message.includes("identificacion_UNIQUE")) {
            res.status(500).json({ type: "error", message: "Cédula ya registrada", data: null });
          } else if (error.message.includes("correo_UNIQUE")) {
            res.status(500).json({ type: "error", message: "Correo ya registrado", data: null });
          }
        } else {
          if (results) {
            const enlace = `https://consultagrosa-production.up.railway.app/validar?usuario=${encodeURIComponent(results.insertId)}`;
            var mailOptions = {
              form: 'consultagrosaprueba@gmail.com',
              to: correo,
              subject: 'Confirma tu cuenta',
              text: `Para activar tu cuenta, haz clic en el siguiente enlace: ${enlace}`,
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.status(500).json({ type: "error", message: error.message, data: null });
              } else {
                res.status(200).json({ type: "success", message: "Se ha enviado un correo de verificacion a " + correo, data: null });
              }
            });

          }
        }
      });
    }
  });

});
router.post('/reenviar_correo', (req, res) => {
  const { correo } = req.body;
  const enlaceValidacion = `https://consultagrosa-production.up.railway.app/validar?correo=${encodeURIComponent(correo)}`;
  var mailOptions = {
    form: 'consultagrosaprueba@gmail.com',
    to: correo,
    subject: 'Confirma tu cuenta',
    text: `Para activar tu cuenta, haz clic en el siguiente enlace: ${enlaceValidacion}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ type: "error", message: error.message, data: null });
    } else {
      return res.status(200).json({ type: "success", message: "Correo enviado correctamente", data: null });
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
  const sql = "SELECT * FROM provincias ORDER BY provincia ASC";
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

  const sql = "SELECT * FROM ciudades WHERE provincia_id = ? ORDER BY ciudad ASC";
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
router.post('/obtener_carrito', (req, res) => {
  const id_usuario = req.body.id_usuario;
  console.log(id_usuario);
  const sql = "SELECT id_carrito, id_producto, img, nombre, precio, carritos.cantidad, carritos.total FROM carritos, productos WHERE productos.id_producto = carritos.producto_id AND usuario_id = ?";
  connection.query(sql, [id_usuario], (error, result) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      result.forEach(element => {
        if (element.img) {
          element.img = element.img.toString();
        }
      });
      res.json({ data: result });
    }
  });
});

router.post('/update_producto', (req, res) => {
  const { codigo, tag, categoria, nombre, descripcion, medida, precio, cantidad, total, img, id_producto } = req.body;
  let sql;
  let values;
  if (img) {
    sql = "UPDATE `productos` SET `codigo`=?,`tag`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medida`=?, `precio`=?,`cantidad`=?,`total`=?,`img`=? WHERE id_producto=?";
    values = [codigo, tag, categoria, nombre, descripcion, medida, precio, cantidad, total, img, id_producto];
  } else {
    sql = "UPDATE `productos` SET `codigo`=?,`tag`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medida`=?, `precio`=?,`cantidad`=?,`total`=? WHERE id_producto=?";
    values = [codigo, tag, categoria, nombre, descripcion, medida, precio, cantidad, total, id_producto];
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
  const { codigo, tag, categoria, nombre, descripcion, medida, precio, cantidad, total, img } = req.body;
  const sql = "INSERT INTO `productos`(`codigo`, `tag`,`categoria_id`,`nombre`,`descripcion`,`medida`,`precio`,`cantidad`,`total`,`img`, `fecha`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
  connection.query(sql, [codigo, tag, categoria, nombre, descripcion, medida, precio, cantidad, total, img, `${year}-${month}-${day}`], (error, results) => {
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
router.post('/delete_carrito', (req, res) => {
  const id_carrito = req.body.id_carrito;
  console.log(id_carrito);
  const sql = "DELETE FROM `carritos` WHERE id_carrito = ?";
  connection.query(sql, [id_carrito], (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ type: "error", message: error.message, data: null });
    } else {
      if (results) {
        return res.status(500).json({ type: "success", message: "Eliminado exitosamente", data: null });
      }
    }
  });
});
router.post('/vaciar_carrito', (req, res) => {
  const id_usuario = req.body.id_usuario;
  console.log(id_usuario);
  const sql = "DELETE FROM `carritos` WHERE usuario_id = ?";
  connection.query(sql, [id_usuario], (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ type: "error", message: error.message, data: null });
    } else {
      if (results) {
        return res.status(500).json({ type: "success", message: "Eliminado exitosamente", data: null });
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
//TODO: Funciones
async function obtener_productos() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria";
    connection.query(sql, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          resolve(result);
        } else {
          resolve(null);
        }
      }
    });
  });
}
async function obtener_producto_id(id_producto) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria AND id_producto = ?";
    connection.query(sql, [id_producto], (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          resolve(result[0]);
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
  const { usuario, contrasena } = req.body
  const query = 'SELECT *FROM `usuarios`LEFT JOIN `perfiles` ON `perfil_id` = `perfiles`.`id_perfil` LEFT JOIN `ciudades` ON `ciudad_id` = `ciudades`.`id_ciudad` LEFT JOIN `provincias` ON `ciudades`.`provincia_id` = `provincias`.`id_provincia` WHERE `usuarios`.`usuario` = ?;';
  connection.query(query, [usuario], (error, results) => {
    if (error) {
      return res.status(500).json({ type: "error", message: "Error al validar" + error, data: null });
    }
    if (results.length === 0) {
      res.status(500).json({ type: "error", message: "Usuario y/o contraseña incorrrectos", data: null });
      return;
    } else {
      const usuario = results[0];
      bcrypt.compare(contrasena, usuario.contrasena, (error, match) => {
        if (match) {
          if (usuario.estado === 0) {
            return res.status(500).json({ type: "warning", message: "Usuario no validado", data: { correo: usuario.correo } });
          }
          req.session.credentials = {
            cliente: usuario,
            administrador: req.session.credentials ? req.session.credentials.administrador : null
          };
          return res.status(200).json({ type: "success", message: "Bienvenido " + usuario.nombre, data: null });
        } else {
          return res.status(500).json({ type: "error", message: "Usuario y/o contraseña incorrrectos", data: null });
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
      res.status(500).json({ error: "Usuario y/o contraseña incorrrectos" });
      return;
    } else {
      const usuario = results[0];
      bcrypt.compare(contrasena, usuario.contrasena, (err, match) => {
        if (err) {
          res.status(500).json({ error: "Usuario y/o contraseña incorrrectos" });
          return;
        }
        if (match) {
          req.session.credentials = {
            cliente: req.session.credentials ? req.session.credentials.cliente : null,
            administrador: usuario
          };
          console.log("Correct user".green);
          res.status(200).json({ message: "Usuario correcto" });
        } else {
          console.log("Password does not match ".red);
          res.status(500).json({ error: "Usuario y/o contraseña incorrrectos" });
        }
      });
    }
  });
});
module.exports = { router, configureSocket };
