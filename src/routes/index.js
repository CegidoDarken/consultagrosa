const express = require('express');
const { Server } = require('socket.io');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { connection } = require('../database');
require('datatables.net-bs5');
let io;
/**
 * Function: configureSocket
 * 
 * Description: This function is used to configure a socket server.
 * 
 * Parameters:
 * - server: The server object to configure the socket on.
 * 
 * Return Type: None
 * 
 * Example Usage:
 * ```
 * const http = require('http');
 * const server = http.createServer();
 * configureSocket(server);
 * ```
 * 
 * Note: This function uses the 'io' variable which should be declared globally
 * before calling this function.
 */
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
/**
 * This is an asynchronous function that handles a request and response. It renders
 * a view called "masvendidos" and passes two variables to the view: "credentials"
 * and "productos".
 * 
 * The "credentials" variable is set to the value of
 * "req.session.credentials.cliente" if it exists, otherwise it is set to null.
 * 
 * The "productos" variable is set to the result of the "obtener_mas_pedidos2()"
 * function, which is awaited to ensure the function waits for the result before
 * proceeding.
 * 
 * Note: The code provided is written in JavaScript.
 */
router.get("/masvendidos", async (req, res) => {
  res.render("masvendidos", { credentials: req.session.credentials ? req.session.credentials.cliente : null, productos: await obtener_mas_pedidos2() });
});
/**
 * This is an asynchronous function that handles a request and response. It checks
 * if the session contains credentials and if the "cliente" property exists within
 * the credentials object.
 * 
 * If the conditions are met, it renders the "perfilcliente" view and passes the
 * "credentials" object from the session as a parameter. Otherwise, it redirects
 * the user to the root ("/") path.
 * 
 * If any error occurs during the execution, it also redirects the user to the root
 * ("/") path.
 */
router.get("/perfilcliente", async (req, res) => {
  try {
    if (req.session.credentials && req.session.credentials.cliente) {
      return res.render("perfilcliente ", { credentials: req.session.credentials ? req.session.credentials.cliente : null });
    } else {
      return res.redirect("/");
    }
  } catch (error) {
    return res.redirect("/");
  }
});
/**
 * This is an asynchronous function that handles a request and response in a
 * JavaScript environment. It checks if the session contains credentials and if
 * the "cliente" property exists within the credentials object.
 * 
 * If the conditions are met, it renders the "pedidoscliente" view and passes the
 * "credentials" object from the session as a parameter. Otherwise, it redirects
 * the user to the root ("/") path.
 * 
 * In case of any error, it also redirects the user to the root ("/") path.
 */
router.get("/pedidoscliente", async (req, res) => {
  try {
    if (req.session.credentials && req.session.credentials.cliente) {
      return res.render("pedidoscliente", { credentials: req.session.credentials ? req.session.credentials.cliente : null });
    } else {
      return res.redirect("/");
    }
  } catch (error) {
    return res.redirect("/");
  }
});
/**
 * This is an asynchronous function that takes in a request object (req) and a
 * response object (res) as parameters. It is used to handle a specific route in a
 * web application.
 * 
 * The function first checks if the "credentials" property exists in the session
 * object of the request and if the "administrador" property is set to true. If
 * both conditions are met, it redirects the user to the "/dashboard" route.
 * 
 * If the conditions are not met, it renders the "admin" view, which is typically a
 * login page for administrators.
 * 
 * If an error occurs during the execution of the function, it also renders the
 * "admin" view.
 * 
 * Note: This code assumes the use of a session middleware that stores user
 * credentials in the session object.
 */
router.get("/admin", async (req, res) => {
  try {
    if (req.session.credentials && req.session.credentials.administrador) {
      return res.redirect("/dashboard");
    } else {
      return res.render("admin");
    }
  } catch (error) {
    return res.render("admin");
  }
});
/**
 * This is an asynchronous function that handles a request and response. It takes
 * in a request object (req) and a response object (res). The function retrieves
 * the "pedido" parameter from the query string of the request.
 * 
 * The function then checks if there are credentials stored in the session object.
 * If there are, it retrieves the "administrador" property from the credentials
 * object, otherwise it sets the credentials variable to null.
 * 
 * Inside a try-catch block, the function renders a view called "devolucionpedidos"
 * and passes the "pedido" and "credentials" variables as data to be used in the
 * view. If an error occurs during rendering, it catches the error and renders a
 * different view called "admin".
 * 
 * Note: The provided code snippet is incomplete and lacks necessary imports and
 * variable declarations.
 */
router.get("/devolucionpedidos", async (req, res) => {
  const { pedido } = req.query;
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  try {
    return res.render("devolucionpedidos", { pedido, credentials });
  } catch (error) {
    return res.render("admin");
  }
});
/**
 * This is an asynchronous function that handles a request and response. It takes
 * in a request object (req) and a response object (res) as parameters.
 * 
 * The function first checks if the "credentials" property exists in the
 * "req.session" object. If it does, it assigns the value of
 * "req.session.credentials.administrador" to the "credentials" variable.
 * Otherwise, it assigns null to "credentials".
 * 
 * Inside a try-catch block, the function then renders a view called "devoluciones"
 * and passes the "credentials" variable as a parameter to the view. If an error
 * occurs during the rendering process, the catch block is executed and the
 * function renders a view called "admin".
 * 
 * Note: The documentation assumes that the code is written in JavaScript.
 */
router.get("/devoluciones", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  try {
    return res.render("devoluciones", { credentials });
  } catch (error) {
    return res.render("admin");
  }
});
/**
 * This is an asynchronous function that handles a request to update the state of a
 * user in a database. The function takes in a request object (req) and a response
 * object (res) as parameters.
 * 
 * The function expects a query parameter called "usuario" to be present in the
 * request. This parameter represents the user ID of the user whose state needs to
 * be updated.
 * 
 * The function constructs an SQL query string to update the "estado" (state)
 * column of the "usuarios" table in the database. The query uses a prepared
 * statement with a placeholder "?" for the user ID.
 * 
 * The function then executes the query using the "connection" object, which
 * represents the database connection. It passes the user ID as a parameter to the
 * query.
 * 
 * If an error occurs during the query execution, the function renders a "validar"
 * view with an error message indicating the failure. The error message includes
 * the specific error received from the database.
 * 
 * If the query is successful, the function renders a "validar" view with a success
 * message indicating that the user's account has been successfully validated.
 * 
 * Note: The code assumes that there is a view template called "validar" that can
 * be rendered with the provided data (type, message, and data).
 */
router.get("/validar", async (req, res) => {
  const { usuario } = req.query;
  const updateQuery = `UPDATE usuarios SET estado = 1 WHERE id_usuario = ?`;
  /**
     * This method takes two parameters: "error" and "result". It is a callback
     * function that is typically used to handle the response of an asynchronous
     * operation.
     * 
     * If an error occurs, it will return a rendered view with the following
     * properties:
     * - "type" set to "error"
     * - "message" set to "Error al actualizar el estado del usuario: " concatenated
     * with the error message
     * - "data" set to null
     * 
     * If no error occurs, it will return a rendered view with the following
     * properties:
     * - "type" set to "success"
     * - "message" set to "Cuenta validada exitosamente"
     * - "data" set to null
     */
  connection.query(updateQuery, [usuario], (error, result) => {
    if (error) {
      return res.render("validar", { type: "error", message: "Error al actualizar el estado del usuario: " + error, data: null });
    }
    return res.render("validar", { type: "success", message: "Cuenta validada exitosamente", data: null });
  });
});
/**
 * This is an asynchronous function that handles a request and response. It takes
 * in a request object (req) and a response object (res) as parameters.
 * 
 * The function retrieves the "usuario" parameter from the query string of the
 * request object using destructuring assignment.
 * 
 * It then renders a view called "recuperar" and passes the "usuario" parameter as
 * data to the view.
 * 
 * Finally, it returns the rendered view as the response.
 */
router.get("/recuperar", async (req, res) => {
  const { usuario } = req.query;
  return res.render("recuperar", { usuario });
});
/**
 * This is an asynchronous function that handles a request and response. It
 * retrieves the "credentials" object from the "req.session" object, specifically
 * the "administrador" property. If the "credentials" object is not found, it is
 * set to null.
 * 
 * The function then renders the "perfiladministrador" view, passing the
 * "credentials" object as a parameter.
 */
router.get("/perfiladministrador", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("perfiladministrador", { credentials });
});
/**
 * This is an asynchronous function that handles a request and response. It
 * retrieves the "credentials" from the session object stored in the request. If
 * the "credentials" exist and have a property called "administrador", it assigns
 * it to the "credentials" variable; otherwise, it assigns null.
 * 
 * Finally, it renders the "usuarios" view, passing the "credentials" as a
 * parameter to the view.
 */
router.get("/usuarios", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("usuarios", { credentials });
});
/**
 * This is an asynchronous function that handles a request and response. It
 * retrieves the "credentials" from the session object stored in the request. If
 * the "credentials" exist, it assigns the value of
 * "req.session.credentials.administrador" to the "credentials" variable;
 * otherwise, it assigns null.
 * 
 * Finally, it renders the "proveedores" view, passing the "credentials" variable
 * as a parameter to the view.
 */
router.get("/proveedores", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("proveedores", { credentials });
});
/**
 * This is an asynchronous function that handles a request and response. It takes
 * in two parameters, `req` and `res`, which represent the request and response
 * objects respectively.
 * 
 * Inside the function, it checks if the `req.session.credentials` object exists.
 * If it does, it assigns the value of `req.session.credentials.administrador` to
 * the `credentials` variable. Otherwise, it assigns `null` to `credentials`.
 * 
 * Finally, it renders the "bodegas" view, passing the `credentials` variable as a
 * parameter to the view.
 */
router.get("/bodegas", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("bodegas", { credentials });
});
/**
 * This is an asynchronous function that handles a request and response. It
 * retrieves the credentials from the session object stored in the request,
 * specifically the "cliente" property. If the credentials are found, they are
 * assigned to the "credentials" variable; otherwise, it is set to null.
 * 
 * The function then renders a view called "contactanos" and passes the
 * "credentials" variable as a parameter to the view.
 */
router.get("/contactanos", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.cliente : null;
  res.render("contactanos", { credentials });
});
/**
 * This is an asynchronous function that handles a request and response. It takes
 * in a request object (req) and a response object (res) as parameters.
 * 
 * The function first checks if the session object has a "credentials" property. If
 * it does, it assigns the value of "req.session.credentials.cliente" to the
 * "credentials" variable. Otherwise, it assigns null to "credentials".
 * 
 * Next, it extracts the "producto" property from the query object of the request
 * and assigns it to the "producto" variable.
 * 
 * Then, it initializes an empty array called "productos_recomendado".
 * 
 * The function calls the "aprioris" function asynchronously, passing in the
 * "producto" variable. It awaits the result and assigns it to the "array"
 * variable.
 * 
 * It then iterates over each element in the "array" using a for...of loop. Inside
 * the loop, it calls the "obtener_producto_id" function asynchronously, passing
 * in the current element. It awaits the result and assigns it to the
 * "producto_id" variable. Finally, it pushes the "producto_id" to the
 * "productos_recomendado" array.
 * 
 * Finally, it renders a view called "detalleproducto" and passes in an object with
 * the properties "credentials" (the value of the "credentials" variable),
 * "producto" (the result of calling "obtener_producto_id" with the "producto"
 * variable), and "recomendados" (the "productos_recomendado" array).
 * 
 * Note: The documentation provided assumes that the "aprioris" and
 * "obtener_producto_id" functions are defined elsewhere in the code.
 */
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

/**
 * This is an asynchronous function that handles a request to send a password
 * recovery email to a user.
 * 
 * Parameters:
 * - req: The request object containing the user's email address in the body.
 * - res: The response object used to send the response back to the client.
 * 
 * Steps:
 * 1. Destructure the email address from the request body.
 * 2. Define a SQL query to select the user from the database based on the email
 * address.
 * 3. Execute the SQL query using the connection object.
 * 4. If there is an error executing the query, log the error and send a 500 status
 * response with an error message.
 * 5. If the query returns no results, send a 404 status response with an error
 * message indicating that the user is not valid.
 * 6. If the query returns a result, generate a recovery link using the user's ID.
 * 7. Define the email options including the sender, recipient, subject, and text
 * content.
 * 8. Use the transporter object to send the email.
 * 9. If there is an error sending the email, send a 500 status response with an
 * error message.
 * 10. If the email is sent successfully, send a 200 status response with a success
 * message.
 */
router.post('/recuperar', async (req, res) => {
  const { correo } = req.body;
  const sql = 'SELECT * FROM usuarios WHERE correo = ?';
  /**
     * This method is a callback function that handles the response of a database
     * query. It takes two parameters: "error" and "results".
     * 
     * If an error occurs during the query, the function logs the error and sends a
     * response with a status code of 500 and a JSON object containing an error
     * message.
     * 
     * If the query is successful but no results are found, the function sends a
     * response with a status code of 404 and a JSON object indicating that the user
     * is not valid.
     * 
     * If the query is successful and results are found, the function generates a URL
     * based on the user's ID and constructs an email with a recovery link. The email
     * is sent using the "transporter" object. If there is an error sending the email,
     * the function sends a response with a status code of 500 and an error message.
     * If the email is sent successfully, the function sends a response with a status
     * code of 200 and a success message.
     */
  connection.query(sql, [correo], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ type: 'error', message: 'Error en la base de datos', data: null });
    } else {
      if (results.length === 0) {
        res.status(404).json({ type: 'error', message: 'Usuario no valido', data: null });
      } else {
        const enlace = `https://consultagrosa-production.up.railway.app/recuperar?usuario=${encodeURIComponent(results[0].id_usuario)}`;
        /**
         * MailOptions object.
         */
        var mailOptions = {
          form: 'consultagrosaprueba@gmail.com',
          to: correo,
          subject: 'Recuperacion de contraseña',
          text: `Para crear una nueva contraseña, haz clic en el siguiente enlace: ${enlace}`,
        };
        /**
         * This method takes two parameters: "error" and "info". It is a callback function
         * that handles the response after attempting to send an email.
         * 
         * If an error occurs, the method will set the response status to 500 and return a
         * JSON object with the following properties:
         * - "type" set to "error"
         * - "message" set to "Error al enviar el correo"
         * - "data" set to null
         * 
         * If no error occurs, the method will set the response status to 200 and return a
         * JSON object with the following properties:
         * - "type" set to "success"
         * - "message" set to "Correo enviado correctamente"
         * - "data" set to null
         */
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

/**
     * This is an asynchronous function named `aprioris` that takes a parameter
     * `producto`. It returns a promise that resolves to an array of recommended
     * products based on the given `producto`.
     * 
     * The function executes a SQL query to retrieve a list of products associated with
     * orders that contain the given `producto`. It then uses the retrieved data to
     * generate recommendations using the Apriori algorithm.
     * 
     * The Apriori algorithm is instantiated with a minimum support threshold of 0.1.
     * It is then executed on the retrieved product data. The resulting frequent
     * itemsets are used to generate recommendations.
     * 
     * The `generateRecommendations` function sorts the itemsets based on their support
     * and extracts the first item from each itemset. These items are added to the
     * recommendations array, ensuring that duplicates are not included.
     * 
     * Finally, the function resolves the promise with the array of recommended
     * products.
     * 
     * If any error occurs during the execution of the SQL query or the Apriori
     * algorithm, the promise is rejected with an error message. If the SQL query
     * returns no results, the promise is resolved with a message indicating that the
     * product is not recognized.
     */
async function aprioris(producto) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT GROUP_CONCAT(`detallepedidos`.`producto_id` SEPARATOR ',') AS `productos` FROM `pedidos` INNER JOIN `detallepedidos` ON `pedidos`.`id_pedido` = `detallepedidos`.`pedido_id` WHERE `pedidos`.`id_pedido` IN (SELECT DISTINCT `detallepedidos`.`pedido_id` FROM `detallepedidos` WHERE `detallepedidos`.`producto_id` = ?) GROUP BY `pedidos`.`id_pedido`, `pedidos`.`usuario_id`, `pedidos`.`fecha`, `pedidos`.`total`;";
    /**
     * This method takes in two parameters: "error" and "results". It is a callback
     * function that handles the response of a database query.
     * 
     * If an error occurs, it will return a JSON object with a "message" property
     * containing the error message.
     * 
     * If there are results, it will process the data to generate product
     * recommendations using the Apriori algorithm.
     * 
     * First, it initializes two empty arrays: "productos" and "productos_recomendado".
     * 
     * Then, it iterates through the "results" array and pushes the "productos"
     * property of each element into the "productos" array.
     * 
     * Next, it creates a new instance of the Apriori algorithm with a minimum support
     * threshold of 0.1.
     * 
     * The algorithm is executed on the "productos" array, and the result is a promise.
     * 
     * Once the promise is resolved, the frequent itemsets are extracted from the
     * result.
     * 
     * A function called "generateRecommendations" is defined to generate the
     * recommendations based on the frequent itemsets.
     * 
     * The itemsets are sorted in descending order of support.
     * 
     * A set called "recommendationSet" is created to keep track of recommended items.
     * 
     * A loop iterates through the itemsets and adds the first item of each itemset to
     * the "recommendations" array if it hasn't been recommended before.
     * 
     * Finally, the "productos_recomendado" array is resolved with the generated
     * recommendations.
     * 
     * If there are no results, it returns a JSON object with a "message" property
     * indicating that the product is not recognized.
     */
    connection.query(sql, [producto], (error, results) => {
      if (error) {
        res.json({ message: error });
      } else {
        if (results) {
          let productos = [];
          let productos_recomendado = [];
          /**
         * The `push` method is used to add one or more elements to the end of an array and
         * returns the new length of the array.
         * 
         * Syntax:
         * ```
         * array.push(element1, element2, ..., elementN)
         * ```
         * 
         * Parameters:
         * - `element1, element2, ..., elementN` (optional): The elements to add to the end
         * of the array.
         * 
         * Return Value:
         * - The new length of the array after adding the elements.
         * 
         * Description:
         * The `push` method modifies the original array by adding one or more elements to
         * the end of it. The elements are provided as arguments to the method. If
         * multiple elements are provided, they are added in the order they appear in the
         * argument list.
         * 
         * Example:
         * ```javascript
         * const productos = ["apple", "banana"];
         * productos.push("orange");
         * console.log(productos); // Output: ["apple", "banana", "orange"]
         * 
         * const numbers = [1, 2, 3];
         * numbers.push(4, 5);
         * console.log(numbers); // Output: [1, 2, 3, 4, 5]
         * ```
         * 
         * Note:
         * - The `push` method modifies the original array and does not create a new array.
         * - The `push` method can be used to add elements of any data type to an array.
         * - The `push` method returns the new length of the array after adding the
         * elements.
         */
          results.forEach(elements => {
            productos.push(elements.productos.split(","));
          });
          var aprioriAlgo = new apriori.Apriori(0.1);
          /**
         * This function takes a result object as a parameter and retrieves the frequent
         * itemsets from it. It then generates recommendations based on these frequent
         * itemsets using the generateRecommendations() function. The recommendations are
         * stored in the productos_recomendado array.
         * 
         * The function iterates through each element in the recommendations array and
         * checks if it is not equal to the producto variable. If it is not equal, the
         * element is added to the productos_recomendado array.
         * 
         * Finally, the function resolves the productos_recomendado array.
         */
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
          /**
         * Generates recommendations based on the given itemsets.
         *
         * @param {Array} itemsets - An array of itemsets.
         * @returns {Array} - An array of recommendations.
         */
          function generateRecommendations(itemsets) {
            /**
             * The function takes two parameters, `a` and `b`, and returns the difference
             * between the `support` property of `b` and `a`. The `support` property is
             * assumed to be a numerical value.
             */
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
/**
         * This is an asynchronous function that handles a request to add a product to a
         * shopping cart. It expects the following parameters in the request body:
         * `usuario_id` (user ID), `producto_id` (product ID), `cantidad_deseada` (desired
         * quantity), and `precio` (price).
         * 
         * The function first checks if any of the required parameters are missing. If so,
         * it returns a 400 status code with an error message indicating the missing
         * fields.
         * 
         * Next, it converts the `cantidad_deseada` and `precio` values to integers using
         * the `parseInt` function.
         * 
         * The function then queries the database to retrieve the current quantity of the
         * product with the specified `producto_id`. If the product is not found, it
         * returns a 404 status code with an error message.
         * 
         * After retrieving the current quantity, it compares it with the desired quantity.
         * If the desired quantity is greater than the available quantity, it returns a
         * 400 status code with an error message indicating that the quantity is not
         * available.
         * 
         * The function then queries the database to check if the product already exists in
         * the user's shopping cart. If it does, it retrieves the current quantity and
         * total price of the product.
         * 
         * If the product is not already in the cart, it sets the `cantidadActual` variable
         * to 0 and `isNewCartItem` to true.
         * 
         * Next, it calculates the new quantity and total price based on the desired
         * quantity and price.
         * 
         * If the new quantity is greater than the available quantity or is 0, it returns a
         * 400 status code with an error message indicating that the quantity is not
         * available.
         * 
         * If `isNewCartItem` is true, it inserts a new row into the `carritos` table with
         * the product ID, user ID, new quantity, and new total price.
         * 
         * If `isNewCartItem` is false, it updates the existing row in the `carritos` table
         * with the new quantity and total price.
         * 
         * Finally, it returns a 200 status code with a success message indicating that the
         * product has been added to the cart.
         * 
         * If any error occurs during the execution of the function, it logs the error and
         * returns a 500 status code with an error message indicating a server error.
         */
router.post('/cambiar_cantidad', async (req, res) => {
  const { usuario_id, producto_id, cantidad_deseada, precio } = req.body;
  console.log(producto_id, cantidad_deseada);
  try {
    if (!usuario_id || !producto_id || !cantidad_deseada || !precio) {
      return res.status(400).json({ type: "error", message: 'Faltan campos requeridos en la solicitud', data: null });
    }
    const cantidadDeseadaInt = parseInt(cantidad_deseada);
    const precioInt = parseInt(precio);
    const productResults = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT cantidad FROM productos WHERE id_producto = ?',
        [producto_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    if (productResults.length === 0) {
      return res.status(404).json({ type: "error", message: 'Producto no encontrado', data: null });
    }

    const cantidadDisponible = productResults[0].cantidad;
    if (cantidadDeseadaInt > cantidadDisponible) {
      return res.status(400).json({ type: "error", message: 'Cantidad no disponible', data: null });
    }
    const cartResults = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT cantidad, total FROM carritos WHERE producto_id = ? AND usuario_id = ? LIMIT 1',
        [producto_id, usuario_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    let cantidadActual = 0;
    let isNewCartItem = true;

    if (cartResults.length !== 0) {
      cantidadActual = cartResults[0].cantidad;
      isNewCartItem = false;
    }

    const nuevaCantidad = cantidadDeseadaInt;
    const nuevoTotal = nuevaCantidad * precioInt;
    if (nuevaCantidad > cantidadDisponible || nuevaCantidad === 0) {
      return res.status(400).json({ type: "error", message: 'Cantidad no disponible', data: null });
    }
    if (isNewCartItem) {
      await new Promise((resolve, reject) => {
        /**
             * This method is used to handle the callback function with an error and result. It
             * takes two parameters: err and result. If the err parameter is not null, it will
             * reject the promise with the err value. Otherwise, it will resolve the promise
             * with the result value.
             */
        connection.query(
          'INSERT INTO carritos (producto_id, usuario_id, cantidad, total) VALUES (?, ?, ?, ?)',
          [producto_id, usuario_id, nuevaCantidad, nuevoTotal],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        );
      });
    } else {

      await new Promise((resolve, reject) => {
        console.log('update', nuevaCantidad);
        connection.query(
          'UPDATE carritos SET cantidad = ?, total = ? WHERE producto_id = ? AND usuario_id = ?',
          [nuevaCantidad, nuevoTotal, producto_id, usuario_id],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        );
      });
    }

    return res.status(200).json({ type: "success", message: 'Producto agregado al carrito', data: null });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ type: "error", message: 'Error en el servidor', data: null });
  }
});

router.post('/agregar_carrito', async (req, res) => {
  const { usuario_id, producto_id, cantidad_deseada, precio } = req.body;

  try {
    if (!usuario_id || !producto_id || !cantidad_deseada || !precio) {
      return res.status(400).json({ type: "error", message: 'Faltan campos requeridos en la solicitud', data: null });
    }
    const cantidadDeseadaInt = parseInt(cantidad_deseada);
    const precioInt = parseInt(precio);
    const productResults = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT cantidad FROM productos WHERE id_producto = ?',
        [producto_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    if (productResults.length === 0) {
      return res.status(404).json({ type: "error", message: 'Producto no encontrado', data: null });
    }

    const cantidadDisponible = productResults[0].cantidad;
    if (cantidadDeseadaInt > cantidadDisponible) {
      return res.status(400).json({ type: "error", message: 'Cantidad no disponible', data: null });
    }
    const cartResults = await new Promise((resolve, reject) => {
      /**
             * This method is used to handle the callback function with an error and result
             * parameters. If an error is present, it will be rejected. If there is no error,
             * the result will be resolved.
             */
      connection.query(
        'SELECT cantidad, total FROM carritos WHERE producto_id = ? AND usuario_id = ? LIMIT 1',
        [producto_id, usuario_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    let cantidadActual = 0;
    let isNewCartItem = true;

    if (cartResults.length !== 0) {
      cantidadActual = cartResults[0].cantidad;
      isNewCartItem = false;
    }

    const nuevaCantidad = cantidadActual + cantidadDeseadaInt;
    const nuevoTotal = nuevaCantidad * precioInt;
    if (nuevaCantidad > cantidadDisponible || nuevaCantidad === 0) {
      return res.status(400).json({ type: "error", message: 'Cantidad no disponible', data: null });
    }
    if (isNewCartItem) {
      await new Promise((resolve, reject) => {
        connection.query(
          'INSERT INTO carritos (producto_id, usuario_id, cantidad, total) VALUES (?, ?, ?, ?)',
          [producto_id, usuario_id, nuevaCantidad, nuevoTotal],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        );
      });
    } else {

      await new Promise((resolve, reject) => {
        connection.query(
          'UPDATE carritos SET cantidad = ?, total = ? WHERE producto_id = ? AND usuario_id = ?',
          [nuevaCantidad, nuevoTotal, producto_id, usuario_id],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        );
      });
    }

    return res.status(200).json({ type: "success", message: 'Producto agregado al carrito', data: null });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ type: "error", message: 'Error en el servidor', data: null });
  }
});


router.get("/", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.cliente : null;
  res.render("index", { credentials });
});
/**
         * The provided code snippet is an asynchronous function that handles a request and
         * response in JavaScript. It uses the `render` method to render a view called
         * "test".
         */
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
  const sql = "SELECT dp.pedido_id, CASE WHEN SUM(CASE WHEN dp.estado = 'Pendiente' THEN 1 ELSE 0 END) > 0 THEN 'Pendiente' WHEN SUM(CASE WHEN dp.estado = 'Cancelado' THEN 1 ELSE 0 END) = COUNT(*) THEN 'Cancelado' ELSE 'Completado' END AS estado, pedidos.id_pedido, pedidos.usuario_id, usuarios.nombre AS nombre_usuario, pedidos.fecha, pedidos.total FROM railway.detallepedidos dp JOIN railway.productos p ON dp.producto_id = p.id_producto JOIN railway.pedidos ON dp.pedido_id = pedidos.id_pedido JOIN railway.usuarios ON pedidos.usuario_id = usuarios.id_usuario GROUP BY dp.pedido_id;";
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
router.post("/obtener_detalle_pedidos", async (req, res) => {
  const { id_pedido } = req.body;
  console.log(id_pedido);
  if (id_pedido) {
    credentials = req.session.credentials ? req.session.credentials.administrador : null;
    const sql = "SELECT dp.id_detalle_pedido, dp.pedido_id, p.nombre AS nombre_producto, p.img, dp.precio, dp.cantidad, dp.total, dp.estado FROM railway.detallepedidos dp JOIN railway.productos p ON dp.producto_id = p.id_producto WHERE dp.pedido_id = ?;";
    /**
             * This method takes two parameters: "error" and "results". It is a callback
             * function that handles the response of a request.
             * 
             * If an error occurs, it sends a response with the error message and logs the
             * error to the console.
             * 
             * If there are results, it iterates through each element and checks if the "img"
             * property exists. If it does, it converts it to a string.
             * 
             * Finally, it sends a JSON response with the modified results or a message
             * indicating that the product is not recognized.
             */
    connection.query(sql, [id_pedido], (error, results) => {
      if (error) {
        res.send({ message: error });
        console.log(error);
      } else {
        if (results) {
          results.forEach(element => {
            if (element.img) {
              element.img = element.img.toString();
            }
          });
          res.json({ data: results });
        } else {
          res.json({ message: "Producto no reconocido" });
        }
      }
    });
  }
});
router.post("/obtener_devoluciones", async (req, res) => {
  const sql = "SELECT d.id_devolucion, p.id_pedido, d.fecha, u.nombre AS usuario, pr.img, pr.nombre AS producto, d.cant_dev, d.motivo FROM devoluciones d JOIN pedidos p ON d.pedido_id = p.id_pedido JOIN usuarios u ON p.usuario_id = u.id_usuario JOIN productos pr ON d.producto_id = pr.id_producto;";
  connection.query(sql, (error, results) => {
    if (error) {
      res.send({ message: error });
      console.log(error);
    } else {
      if (results) {
        results.forEach(element => {
          if (element.img) {
            element.img = element.img.toString();
          }
        });
        res.json({ data: results });
      } else {
        res.json({ message: "Producto no reconocido" });
      }
    }
  });

});
router.post("/obtener_detalle_pedidos2", async (req, res) => {
  const { id_pedido } = req.body;
  console.log(id_pedido);
  if (id_pedido) {
    credentials = req.session.credentials ? req.session.credentials.administrador : null;
    const sql = "SELECT dp.id_detalle_pedido, dp.pedido_id, p.id_producto, p.nombre AS nombre_producto, p.img, dp.precio, dp.cantidad, dp.total, dp.estado FROM railway.detallepedidos dp JOIN railway.productos p ON dp.producto_id = p.id_producto WHERE dp.pedido_id = ? AND dp.estado = 'Aprobado';";
    /**
             * This method takes two parameters: "error" and "results". It is a callback
             * function that handles the response of a request.
             * 
             * If an error occurs, it sends a response with the error message and logs the
             * error to the console.
             * 
             * If there are results, it iterates through each element and checks if the "img"
             * property exists. If it does, it converts it to a string.
             * 
             * Finally, it sends a JSON response with the modified results or a message
             * indicating that the product is not recognized.
             */
    connection.query(sql, [id_pedido], (error, results) => {
      if (error) {
        res.send({ message: error });
        console.log(error);
      } else {
        if (results) {
          results.forEach(element => {
            if (element.img) {
              element.img = element.img.toString();
            }
          });
          res.json({ data: results });
        } else {
          res.json({ message: "Producto no reconocido" });
        }
      }
    });
  }
});
router.post("/obtener_pedidos_cliente", async (req, res) => {
  const id_usuario = req.body.id_usuario;
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  const sql = "SELECT dp.pedido_id, CASE WHEN SUM(CASE WHEN dp.estado = 'Pendiente' THEN 1 ELSE 0 END) = COUNT(*) THEN 'Pendiente' WHEN SUM(CASE WHEN dp.estado = 'Cancelado' THEN 1 ELSE 0 END) = COUNT(*) THEN 'Cancelado' ELSE 'Completado' END AS estado, pedidos.id_pedido, pedidos.usuario_id, usuarios.nombre AS nombre_usuario, pedidos.fecha, pedidos.total FROM railway.detallepedidos dp JOIN railway.productos p ON dp.producto_id = p.id_producto JOIN railway.pedidos ON dp.pedido_id = pedidos.id_pedido JOIN railway.usuarios ON pedidos.usuario_id = usuarios.id_usuario WHERE usuarios.id_usuario = " + id_usuario + " GROUP BY dp.pedido_id ORDER BY pedidos.fecha ASC";
  connection.query(sql, (error, results) => {
    if (error) {
      res.send({ message: error });
      console.log(error);
    } else {
      if (results) {
        results.forEach(element => {
          if (element.img) {
            element.img = element.img.toString();
          }
        });
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
        /**
             * This is an asynchronous function that takes an error parameter. It returns a
             * promise that either rejects with the error parameter if it exists, or resolves
             * with no value if the error parameter is falsy.
             */
        connection.query(insertDetallePedidoQuery, [pedidoId, id_producto, precio, cantidad, (cantidad * precio), "Pendiente"], async (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    res.status(200).json({ type: "success", message: 'Pedidos realizados exitosamente', data: null });
  } catch (error) {
    console.error('Error creating orders:', error);
    res.status(500).json({ type: "error", message: 'Error al crear pedidos', data: null });
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
router.get("/abastecimiento", async (req, res) => {
  credentials = req.session.credentials ? req.session.credentials.administrador : null;
  res.render("abastecimiento", { credentials });
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
router.post("/actividades_registros_anual", async (req, res) => {
  let anio = req.body.anio;
  res.json({ productos: await actividades_productos_anual(anio), usuarios: await actividades_usuarios_anual(anio), proveedores: await actividades_proveedores_anual(anio) });
});
/**
         * This is an asynchronous function that handles a request and response. It takes
         * in the request object (req) and response object (res) as parameters.
         * 
         * The function retrieves the 'anio' and 'mes' values from the request body.
         * 
         * It then calls three separate functions: 'actividades_productos_mes',
         * 'actividades_usuarios_mes', and 'actividades_proveedores_mes'. These functions
         * are expected to return promises.
         * 
         * The function uses the 'await' keyword to wait for each promise to resolve before
         * proceeding.
         * 
         * Finally, the function sends a JSON response to the client with three properties:
         * 'productos', 'usuarios', and 'proveedores'. The values of these properties are
         * the results of the corresponding asynchronous functions.
         */
router.post("/actividades_registros_mes", async (req, res) => {
  let anio = req.body.anio;
  let mes = req.body.mes;
  res.json({ productos: await actividades_productos_mes(anio, mes), usuarios: await actividades_usuarios_mes(anio, mes), proveedores: await actividades_proveedores_mes(anio, mes) });
});
router.post("/actividades_pedidos_anual", async (req, res) => {
  let anio = req.body.anio;
  res.json({ pedidos: await actividades_pedidos_anual(anio) });
});
router.post("/actividades_pedidos_mes", async (req, res) => {
  let anio = req.body.anio;
  let mes = req.body.mes;
  res.json({ pedidos: await actividades_pedidos_mes(anio, mes) });
});
/**
         * This is an asynchronous function that handles a request and response. It takes a
         * request object (req) and a response object (res) as parameters.
         * 
         * The function retrieves the 'anio' value from the request body and assigns it to
         * the 'anio' variable.
         * 
         * Then, it sends a JSON response with the 'ganancias' property set to the result
         * of the 'ganancias_pedidos_anual' function, which is awaited. The
         * 'ganancias_pedidos_anual' function is expected to return a promise that
         * resolves to the desired value.
         * 
         * Note: The code assumes that the 'ganancias_pedidos_anual' function is defined
         * elsewhere in the codebase.
         */
router.post("/ganancias_pedidos_anual", async (req, res) => {
  let anio = req.body.anio;
  res.json({ ganancias: await ganancias_pedidos_anual(anio) });
});
router.post("/ganancias_pedidos_mes", async (req, res) => {
  let anio = req.body.anio;
  let mes = req.body.mes;
  res.json({ ganancias: await ganancias_pedidos_mes(anio, mes) });
});
router.post("/ganancias_productos_anual", async (req, res) => {
  let anio = req.body.anio;
  res.json({ ganancias: await ganancias_productos_anual(anio) });
});
router.post("/ganancias_productos_mes", async (req, res) => {
  let anio = req.body.anio;
  let mes = req.body.mes;
  res.json({ ganancias: await ganancias_productos_mes(anio, mes) });
});
router.post("/mas_pedidos_anual", async (req, res) => {
  let anio = req.body.anio;
  res.json({ data: await mas_pedidos_anual(anio) });
});
router.post("/mas_pedidos_mes", async (req, res) => {
  let anio = req.body.anio;
  let mes = req.body.mes;
  res.json({ data: await mas_pedidos_mes(anio, mes) });
});
/**
         * This is an asynchronous function that handles a request and response. It returns
         * a JSON object with a key "data" that contains the result of the
         * "abastecimiento" function, which is awaited.
         */
router.post("/abastecimiento", async (req, res) => {
  res.json({ data: await abastecimiento() });
});
router.post("/count_abastecimiento", async (req, res) => {
  res.json({ data: await count_abastecimiento() });
});
async function count_abastecimiento() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT COUNT(*) AS cantidad  FROM `productos` WHERE `cantidad` < `min`;";
    connection.query(sql, (error, result) => {
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
async function abastecimiento() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT `img`,`nombre`,`cantidad`, `min` FROM `railway`.`productos` WHERE `cantidad` < `min`;";
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
async function actividades_pedidos_anual(anio) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT meses.mes AS mes, IFNULL(COUNT(pedidos.id_pedido), 0) AS product_count FROM (SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS meses LEFT JOIN `railway`.`pedidos` ON meses.mes = MONTH(`pedidos`.`fecha`) AND YEAR(`pedidos`.`fecha`) = " + anio + " GROUP BY meses.mes ORDER BY meses.mes;";
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
async function actividades_pedidos_mes(anio, mes) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT nums.num AS dia, IFNULL(COUNT(`pedidos`.`id_pedido`), 0) AS product_count FROM (SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31) AS nums LEFT JOIN `railway`.`pedidos` ON nums.num = DAY(`pedidos`.`fecha`) AND MONTH(`pedidos`.`fecha`) = " + mes + " AND YEAR(`pedidos`.`fecha`) = " + anio + " GROUP BY nums.num;";
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
async function ganancias_pedidos_anual(anio) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT meses.mes AS mes, IFNULL(SUM(pedidos.total), 0) AS product_count FROM (SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS meses LEFT JOIN `railway`.`pedidos` ON meses.mes = MONTH(`pedidos`.`fecha`) AND YEAR(`pedidos`.`fecha`) = " + anio + " GROUP BY meses.mes ORDER BY meses.mes;";
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
} async function ganancias_pedidos_mes(anio, mes) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT nums.num AS dia, IFNULL(SUM(pedidos.total), 0) AS product_count FROM (SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31) AS nums LEFT JOIN `railway`.`pedidos` ON nums.num = DAY(`pedidos`.`fecha`) AND MONTH(`pedidos`.`fecha`) = " + mes + " AND YEAR(`pedidos`.`fecha`) = " + anio + " GROUP BY nums.num;";
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
async function ganancias_productos_anual(anio) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT pr.img, pr.nombre as producto, dp.precio, SUM(dp.cantidad) AS vendidos, SUM(dp.total) AS ganancias FROM `railway`.`pedidos` LEFT JOIN `railway`.`detallepedidos` as dp ON pedidos.id_pedido = dp.pedido_id LEFT JOIN `railway`.`productos` AS pr ON dp.producto_id = pr.id_producto WHERE YEAR(pedidos.fecha) = " + anio + " GROUP BY pr.img, pr.nombre, dp.precio ORDER BY ganancias DESC LIMIT 10";
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
/**
                                                                     * Retrieves the top 10 products with the highest earnings for a given year and month.
                                                                     * 
                                                                     * @param {number} anio - The year for which to retrieve the earnings.
                                                                     * @param {number} mes - The month for which to retrieve the earnings.
                                                                     * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects representing the top 10 products with their earnings.
                                                                     * @throws {Error} If there is an error executing the SQL query.
                                                                     */
async function ganancias_productos_mes(anio, mes) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT pr.img, pr.nombre as producto, dp.precio, SUM(dp.cantidad) AS vendidos, SUM(dp.total) AS ganancias FROM `railway`.`pedidos` LEFT JOIN `railway`.`detallepedidos` as dp ON pedidos.id_pedido = dp.pedido_id LEFT JOIN `railway`.`productos` AS pr ON dp.producto_id = pr.id_producto WHERE YEAR(pedidos.fecha) = " + anio + " AND MONTH(`pedidos`.`fecha`) = " + mes + " GROUP BY pr.img, pr.nombre, dp.precio ORDER BY ganancias DESC LIMIT 10";
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
async function actividades_productos_anual(anio) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT meses.mes AS mes, IFNULL(COUNT(productos.id_producto), 0) AS product_count FROM (SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS meses LEFT JOIN `railway`.`productos` ON meses.mes = MONTH(`productos`.`fecha`) AND YEAR(`productos`.`fecha`) = " + anio + " GROUP BY meses.mes ORDER BY meses.mes;";
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
async function actividades_productos_mes(anio, mes) {
  return new Promise((resolve, reject) => {

    const sql = "SELECT nums.num AS dia, IFNULL(COUNT(productos.id_producto), 0) AS product_count FROM (SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31) AS nums LEFT JOIN `railway`.`productos` ON nums.num = DAY(`productos`.`fecha`) AND MONTH(`productos`.`fecha`) = " + mes + " AND YEAR(`productos`.`fecha`) = " + anio + " GROUP BY nums.num;";
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
async function actividades_usuarios_anual(anio) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT meses.mes AS mes, IFNULL(COUNT(usuarios.id_usuario), 0) AS product_count FROM (SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS meses LEFT JOIN `railway`.`usuarios` ON meses.mes = MONTH(`usuarios`.`fecha`) AND YEAR(`usuarios`.`fecha`) = " + anio + " GROUP BY meses.mes ORDER BY meses.mes;";
    connection.query(sql, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          const product_count = result.map(item => item.product_count);
          resolve(product_count);
        } else {
          resolve(null);
        }
      }
    });
  });
}
async function actividades_usuarios_mes(anio, mes) {
  return new Promise((resolve, reject) => {

    const sql = "SELECT nums.num AS dia, IFNULL(COUNT(usuarios.id_usuario), 0) AS product_count FROM (SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31) AS nums LEFT JOIN `railway`.`usuarios` ON nums.num = DAY(`usuarios`.`fecha`) AND MONTH(`usuarios`.`fecha`) = " + mes + " AND YEAR(`usuarios`.`fecha`) = " + anio + " GROUP BY nums.num;";
    /**
                                                                                                     * This method takes in two parameters: "error" and "result". It returns a promise
                                                                                                     * that either resolves with an array of product counts or rejects with an error.
                                                                                                     * 
                                                                                                     * If an error is passed as the "error" parameter, the promise is rejected with
                                                                                                     * that error.
                                                                                                     * 
                                                                                                     * If no error is passed and the "result" array has a length greater than 0, the
                                                                                                     * method maps over each item in the "result" array and extracts the
                                                                                                     * "product_count" property. It then resolves the promise with an array of these
                                                                                                     * product counts.
                                                                                                     * 
                                                                                                     * If no error is passed and the "result" array has a length of 0, the method
                                                                                                     * resolves the promise with null.
                                                                                                     */
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
async function actividades_proveedores_anual(anio) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT meses.mes AS mes, IFNULL(COUNT(proveedores.id_proveedor), 0) AS product_count FROM (SELECT 1 AS mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS meses LEFT JOIN `railway`.`proveedores` ON meses.mes = MONTH(`proveedores`.`fecha`) AND YEAR(`proveedores`.`fecha`) = " + anio + " GROUP BY meses.mes ORDER BY meses.mes;";
    connection.query(sql, (error, result) => {
      if (error) {
        reject(error);
      } else {
        if (result.length > 0) {
          const product_count = result.map(item => item.product_count);
          resolve(product_count);
        } else {
          resolve(null);
        }
      }
    });
  });
}
async function actividades_proveedores_mes(anio, mes) {
  return new Promise((resolve, reject) => {

    const sql = "SELECT nums.num AS dia, IFNULL(COUNT(proveedores.id_proveedor), 0) AS product_count FROM (SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31) AS nums LEFT JOIN `railway`.`proveedores` ON nums.num = DAY(`proveedores`.`fecha`) AND MONTH(`proveedores`.`fecha`) = " + mes + " AND YEAR(`proveedores`.`fecha`) = " + anio + " GROUP BY nums.num;";
    /**
                                                                                                                     * This method takes in two parameters: "error" and "result". It returns a promise
                                                                                                                     * that either resolves with an array of product counts or rejects with an error.
                                                                                                                     * 
                                                                                                                     * If an error is passed as the "error" parameter, the promise is rejected with
                                                                                                                     * that error.
                                                                                                                     * 
                                                                                                                     * If no error is passed and the "result" array has a length greater than 0, the
                                                                                                                     * method maps over each item in the "result" array and extracts the
                                                                                                                     * "product_count" property. It then resolves the promise with an array of these
                                                                                                                     * product counts.
                                                                                                                     * 
                                                                                                                     * If no error is passed and the "result" array has a length of 0, the method
                                                                                                                     * resolves the promise with null.
                                                                                                                     */
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
async function mas_pedidos_anual(anio) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT DISTINCT pr.img, pr.codigo, pr.nombre, dp.precio, dp.vendidos, dp.ganancias FROM (SELECT dp.producto_id, dp.precio, SUM(dp.cantidad) AS vendidos, SUM(dp.total) AS ganancias FROM railway.pedidos LEFT JOIN railway.detallepedidos AS dp ON pedidos.id_pedido = dp.pedido_id WHERE YEAR(pedidos.fecha) = ? GROUP BY dp.producto_id, dp.precio ORDER BY vendidos DESC LIMIT 10) AS dp LEFT JOIN railway.productos AS pr ON dp.producto_id = pr.id_producto;"
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
          resolve([]);
        }
      }
    });
  });
}
/**
                                                                                                                                     * This is an asynchronous function named `mas_pedidos_mes` that retrieves the top
                                                                                                                                     * 10 most ordered products for a given year and month from a database. The
                                                                                                                                     * function takes two parameters: `anio` (year) and `mes` (month).
                                                                                                                                     * 
                                                                                                                                     * The function returns a Promise that resolves to an array of objects representing
                                                                                                                                     * the products. Each object contains the following properties:
                                                                                                                                     * 
                                                                                                                                     * - `img`: The image of the product (as a string).
                                                                                                                                     * - `codigo`: The code of the product.
                                                                                                                                     * - `nombre`: The name of the product.
                                                                                                                                     * - `precio`: The price of the product.
                                                                                                                                     * - `vendidos`: The total quantity of the product sold.
                                                                                                                                     * - `ganancias`: The total earnings generated by selling the product.
                                                                                                                                     * 
                                                                                                                                     * The function executes a SQL query to fetch the required data from the database.
                                                                                                                                     * It joins the `pedidos` and `detallepedidos` tables to retrieve the product
                                                                                                                                     * information along with the total quantity sold and earnings for each product.
                                                                                                                                     * The query filters the results based on the provided year and month. The
                                                                                                                                     * products are then sorted in descending order of the quantity sold and limited
                                                                                                                                     * to the top 10.
                                                                                                                                     * 
                                                                                                                                     * If the query is successful and returns results, the function converts the image
                                                                                                                                     * property to a string (if it exists) and resolves the Promise with the resulting
                                                                                                                                     * array of products. If the query returns no results, an empty array is resolved.
                                                                                                                                     * If an error occurs during the query execution, the Promise is rejected with the
                                                                                                                                     * error.
                                                                                                                                     */
async function mas_pedidos_mes(anio, mes) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT pr.img, pr.codigo, pr.nombre, dp.precio, dp.vendidos, dp.ganancias FROM (SELECT dp.producto_id, dp.precio, SUM(dp.cantidad) AS vendidos, SUM(dp.total) AS ganancias FROM railway.pedidos LEFT JOIN railway.detallepedidos AS dp ON pedidos.id_pedido = dp.pedido_id WHERE YEAR(pedidos.fecha) = ? AND MONTH(pedidos.fecha) = ? GROUP BY dp.producto_id, dp.precio ORDER BY vendidos DESC LIMIT 10) AS dp LEFT JOIN railway.productos AS pr ON dp.producto_id = pr.id_producto;"
    connection.query(sql, [anio, mes], (error, result) => {
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
          resolve([]);
        }
      }
    });
  });
}
/**
                                                                                                                                             * This is an asynchronous function named "obtener_num_clientes" that returns a
                                                                                                                                             * Promise. It retrieves the number of clients from a database table named
                                                                                                                                             * "usuarios" using a SQL query. The function takes no parameters.
                                                                                                                                             * 
                                                                                                                                             * The function executes the SQL query using the "connection" object. If an error
                                                                                                                                             * occurs during the query execution, the Promise is rejected with the error. If
                                                                                                                                             * the query is successful and returns at least one row, the Promise is resolved
                                                                                                                                             * with the value of the "num_clientes" column from the first row. If the query
                                                                                                                                             * returns no rows, the Promise is resolved with a value of null.
                                                                                                                                             */
async function obtener_num_clientes() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT count(*) AS num_clientes FROM usuarios";
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
async function obtener_mas_pedidos2() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT p.id_producto, p.img, p.nombre, p.precio, p.medida, p.cantidad, c.categoria, SUM(d.cantidad) AS vendidos FROM productos p INNER JOIN detallepedidos d ON p.id_producto = d.producto_id INNER JOIN categorias c ON p.categoria_id = c.id_categoria WHERE p.categoria_id = c.id_categoria GROUP BY p.id_producto ORDER BY vendidos DESC LIMIT 20;";
    /**
                                                                                                                                                             * This method takes in two parameters: `error` and `result`. It returns a promise
                                                                                                                                                             * that either resolves with the modified `result` or rejects with the provided
                                                                                                                                                             * `error`.
                                                                                                                                                             * 
                                                                                                                                                             * If an `error` is provided, the method will reject the promise with the given
                                                                                                                                                             * `error`.
                                                                                                                                                             * 
                                                                                                                                                             * If the `result` array has a length greater than 0, the method will iterate over
                                                                                                                                                             * each element in the `result` array. If an `img` property exists in an element,
                                                                                                                                                             * it will be converted to a string using the `toString()` method.
                                                                                                                                                             * 
                                                                                                                                                             * Finally, if the `result` array is empty, the method will resolve the promise
                                                                                                                                                             * with `null`.
                                                                                                                                                             */
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
    /**
                                                                                                                                                                             * This method takes in two parameters: `error` and `result`. It is a callback
                                                                                                                                                                             * function that handles the response of an asynchronous operation.
                                                                                                                                                                             * 
                                                                                                                                                                             * If an `error` is present, it will reject the promise with the provided error.
                                                                                                                                                                             * Otherwise, it will check if the `result` array has a length greater than 0. If
                                                                                                                                                                             * it does, it will iterate over each element in the `result` array and convert
                                                                                                                                                                             * the `img` property to a string if it exists. Finally, it will resolve the
                                                                                                                                                                             * promise with the modified `result` array. If the `result` array is empty, it
                                                                                                                                                                             * will resolve the promise with `null`.
                                                                                                                                                                             */
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
/**
                                                                                                                                                                                     * This is an asynchronous function named "obtener_num_proveedores" that returns a
                                                                                                                                                                                     * Promise. It retrieves the count of records from the "proveedores" table in a
                                                                                                                                                                                     * database using a SQL query. The function takes no parameters.
                                                                                                                                                                                     * 
                                                                                                                                                                                     * The function executes the SQL query using the "connection" object and handles
                                                                                                                                                                                     * the result in a callback function. If an error occurs during the query
                                                                                                                                                                                     * execution, the Promise is rejected with the error. Otherwise, if the query
                                                                                                                                                                                     * returns at least one record, the Promise is resolved with the value of the
                                                                                                                                                                                     * "num_proveedores" field from the first record. If the query returns no records,
                                                                                                                                                                                     * the Promise is resolved with a null value.
                                                                                                                                                                                     * 
                                                                                                                                                                                     * To use this function, you need to have a valid "connection" object established
                                                                                                                                                                                     * with the database.
                                                                                                                                                                                     */
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
  const sqlCategorias = "SELECT * FROM categorias ORDER BY categoria ASC";
  const sqlProveedores = "SELECT * FROM proveedores"; // Replace 'proveedores' with the actual table name

  connection.query(sqlCategorias, (error, categorias) => {
    if (error) {
      res.render("productos", { credentials, categorias: error.message });
    } else {
      connection.query(sqlProveedores, (error, proveedores) => {
        if (error) {
          res.render("productos", { credentials, categorias, proveedores: error.message });
        } else {
          if (categorias.length > 0) {
            res.render("productos", { credentials, categorias, proveedores });
          } else {
            res.render("productos", { credentials, categorias: null, proveedores });
          }
        }
      });
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
  const sql = "SELECT id_producto, proveedor_id, categoria_id, img, codigo, productos.nombre AS producto, proveedores.nombre AS proveedor, categoria, tag, medida, precio, descripcion, min, cantidad, total, productos.fecha FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id_categoria LEFT JOIN proveedores ON productos.proveedor_id = proveedores.id_proveedor;";
  connection.query(sql, (error, productos) => {
    if (error) {
      res.json({ data: error.message });
    } else {
      /**
                                                                                                                                                                                                 * The method takes an object as a parameter and checks if the object has a
                                                                                                                                                                                                 * property called "img". If the "img" property exists, it converts its value to a
                                                                                                                                                                                                 * string.
                                                                                                                                                                                                 */
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
router.post("/aprobar_pedidos", async (req, res) => {
  const { seleccionados } = req.body;
  if (seleccionados.length > 0) {
    /**
                                                                                                                                                                                             * Updates the estado field of a detallepedido with the specified id_detalle_pedido
                                                                                                                                                                                             * to 'Aprobado'.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * Parameters:
                                                                                                                                                                                             * - id_detalle_pedido: The id of the detallepedido to be updated.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * Example usage:
                                                                                                                                                                                             * ```
                                                                                                                                                                                             * id_detalle_pedido => {
                                                                                                                                                                                                 * const sqlUpdateSeleccionado = `UPDATE detallepedidos SET estado = 'Aprobado'
                                                                                                                                                                                                 * WHERE id_detalle_pedido = ?`;
                                                                                                                                                                                                 * connection.query(sqlUpdateSeleccionado, [id_detalle_pedido], (error, result)
                                                                                                                                                                                                 * => {
                                                                                                                                                                                                     * if (error) {
                                                                                                                                                                                                         * console.error(`Error al actualizar seleccionado con ID ${id}:`, error);
                                                                                                                                                                                                         * }
                                                                                                                                                                                                     * });
                                                                                                                                                                                                 * }
                                                                                                                                                                                             */
    seleccionados.forEach(id_detalle_pedido => {
      const sqlUpdateSeleccionado = `UPDATE detallepedidos SET estado = 'Aprobado' WHERE id_detalle_pedido = ?`;
      connection.query(sqlUpdateSeleccionado, [id_detalle_pedido], (error, result) => {
        if (error) {
          console.error(`Error al actualizar seleccionado con ID ${id}:`, error);
        }
      });
    });
  }

  res.json({ type: "success", message: "Pedidos actualizados con éxito" });
});
router.post("/cancelar_pedidos", async (req, res) => {
  const { seleccionados } = req.body;
  if (seleccionados.length > 0) {
    seleccionados.forEach(id_detalle_pedido => {
      const sqlUpdateSeleccionado = `UPDATE detallepedidos SET estado = 'Cancelado' WHERE id_detalle_pedido = ?`;
      connection.query(sqlUpdateSeleccionado, [id_detalle_pedido], (error, result) => {
        if (error) {
          console.error(`Error al actualizar seleccionado con ID ${id}:`, error);
        }
      });
    });
  }

  res.json({ type: "success", message: "Pedidos actualizados con éxito" });
});
router.post("/devolver_pedidos", async (req, res) => {
  const { seleccionados } = req.body;
  try {
    let successCount = 0;
    for (const element of seleccionados) {
      const pedidoId = element.pedido_id;
      const productoId = element.id_producto;
      const cantDev = element.cant_dev;
      const cantidad = element.cantidad;
      if (cantDev <= cantidad && cantDev != 0) {
        await new Promise((resolve, reject) => {
          connection.execute(
            'INSERT INTO devoluciones (pedido_id, producto_id, fecha, motivo, cant_dev) VALUES (?, ?, ?, ?, ?)',
            [pedidoId, productoId, new Date(), element.observacion, cantDev], (error, result) => {
              if (error) {
                console.error(`Error al actualizar: `, error);
                reject(error);
              } else {
                console.log(`Inserted devolucion with ID: ${result.insertId}`);
                successCount++;
                resolve();
              }
            });
        });
      } else {
        console.log(`cant_dev is greater than cantidad for pedido ID: ${pedidoId}`);
      }
    }
    res.json({ type: "success", message: `Pedidos actualizados con éxito. Filas afectadas: ${successCount}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: "error", message: "Error en el servidor" });
  }
});
/**
                                                                                                                                                                                         * This method is used to handle a POST request for user registration. It expects
                                                                                                                                                                                         * the following parameters in the request body: `ciudad`, `usuario`,
                                                                                                                                                                                         * `contrasena`, `direccion`, `identificacion`, `nombre`, `correo`, and
                                                                                                                                                                                         * `telefono`.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * The method first hashes the password using bcrypt with a salt factor of 10. If
                                                                                                                                                                                         * an error occurs during the hashing process, a 500 error response is sent with
                                                                                                                                                                                         * the error message.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * Next, the current date is obtained and formatted to be stored in the database.
                                                                                                                                                                                         * The SQL query is then constructed to insert the user data into the `usuarios`
                                                                                                                                                                                         * table.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * The query is executed using the `connection.query` method. If an error occurs
                                                                                                                                                                                         * during the execution, the error is logged and appropriate error responses are
                                                                                                                                                                                         * sent based on the type of error (e.g., duplicate username, duplicate
                                                                                                                                                                                         * identification, duplicate email).
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If the query is successful, an email verification link is generated using the
                                                                                                                                                                                         * inserted user's ID. The link is sent to the user's email address using the
                                                                                                                                                                                         * `transporter.sendMail` method. If an error occurs during the email sending
                                                                                                                                                                                         * process, a 500 error response is sent with the error message. Otherwise, a 200
                                                                                                                                                                                         * success response is sent with a message indicating that a verification email
                                                                                                                                                                                         * has been sent to the user's email address.
                                                                                                                                                                                         */
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
            /**
                                                                                                                                                                                                     * MailOptions object.
                                                                                                                                                                                                     */
            var mailOptions = {
              form: 'consultagrosaprueba@gmail.com',
              to: correo,
              subject: 'Confirma tu cuenta',
              text: `Para activar tu cuenta, haz clic en el siguiente enlace: ${enlace}`,
            };
            /**
                                                                                                                                                                                                     * This method takes two parameters: `error` and `info`. It is typically used as a
                                                                                                                                                                                                     * callback function to handle the response of an asynchronous operation.
                                                                                                                                                                                                     * 
                                                                                                                                                                                                     * If an `error` is provided, the method will set the HTTP status code to 500 and
                                                                                                                                                                                                     * return a JSON response with the following structure:
                                                                                                                                                                                                     * ```
                                                                                                                                                                                                     * {
                                                                                                                                                                                                         * "type": "error",
                                                                                                                                                                                                         * "message": <error message>,
                                                                                                                                                                                                         * "data": null
                                                                                                                                                                                                         * }
                                                                                                                                                                                                     * ```
                                                                                                                                                                                                     * 
                                                                                                                                                                                                     * If no `error` is provided, the method will set the HTTP status code to 200 and
                                                                                                                                                                                                     * return a JSON response with the following structure:
                                                                                                                                                                                                     * ```
                                                                                                                                                                                                     * {
                                                                                                                                                                                                         * "type": "success",
                                                                                                                                                                                                         * "message": "Se ha enviado un correo de verificacion a <correo>",
                                                                                                                                                                                                         * "data": null
                                                                                                                                                                                                         * }
                                                                                                                                                                                                     * ```
                                                                                                                                                                                                     * Note that `<correo>` should be replaced with the actual email address.
                                                                                                                                                                                                     * 
                                                                                                                                                                                                     * This method is typically used in an Express.js route handler to send a response
                                                                                                                                                                                                     * back to the client after completing an operation.
                                                                                                                                                                                                     */
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
  /**
                                                                                                                                                                                             * MailOptions object.
                                                                                                                                                                                             */
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
/**
                                                                                                                                                                                         * This method is an asynchronous function that handles a request and response. It
                                                                                                                                                                                         * executes a SQL query to retrieve data from multiple tables using JOIN
                                                                                                                                                                                         * operations. The query selects all columns from the "usuarios" table and joins
                                                                                                                                                                                         * it with the "perfiles" table on the "perfil_id" column. It also performs left
                                                                                                                                                                                         * joins with the "ciudades" table on the "ciudad_id" column and the "provincias"
                                                                                                                                                                                         * table on the "provincia_id" column.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If an error occurs during the query execution, the method sends a JSON response
                                                                                                                                                                                         * with the error message. Otherwise, if the query returns any rows, the method
                                                                                                                                                                                         * sends a JSON response with the result data. If no rows are returned, the method
                                                                                                                                                                                         * sends a JSON response with a null value for the data.
                                                                                                                                                                                         */
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
router.post("/obtener_proveedores", async (req, res) => {
  const sql = "SELECT * FROM `proveedores` LEFT JOIN `ciudades` ON `proveedores`.`ciudad_id` = `ciudades`.`id_ciudad` LEFT JOIN provincias ON ciudades.provincia_id = provincias.id_provincia";
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
router.post("/obtener_bodegas", async (req, res) => {
  const sql = "SELECT * FROM `bodegas` LEFT JOIN `usuarios` ON `bodegas`.`usuario_id` = `usuarios`.`id_usuario`";
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
  /**
                                                                                                                                                                                             * This method is a callback function that takes two parameters: "error" and
                                                                                                                                                                                             * "result". It is typically used in asynchronous operations to handle the
                                                                                                                                                                                             * response.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * If an error occurs during the operation, the function will execute the code
                                                                                                                                                                                             * inside the "if" block. It will set the HTTP status code to 500 (Internal Server
                                                                                                                                                                                             * Error) and send a JSON response with an "error" property containing the error
                                                                                                                                                                                             * message.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * If the operation is successful and no error occurs, the function will execute
                                                                                                                                                                                             * the code inside the "else" block. It will send a JSON response with a "data"
                                                                                                                                                                                             * property containing the result.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * This method is commonly used in web development to handle API responses and
                                                                                                                                                                                             * provide appropriate feedback to the client.
                                                                                                                                                                                             */
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
/**
                                                                                                                                                                                         * This is an asynchronous function that handles a request and response. It
                                                                                                                                                                                         * executes a SQL query to retrieve all records from the "perfiles" table.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * The function takes two parameters: "req" (request) and "res" (response).
                                                                                                                                                                                         * 
                                                                                                                                                                                         * Inside the function, a SQL query string is defined as "SELECT * FROM perfiles".
                                                                                                                                                                                         * 
                                                                                                                                                                                         * The query is executed using the "connection.query()" method. It takes two
                                                                                                                                                                                         * parameters: the SQL query and a callback function.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If an error occurs during the query execution, the callback function sets the
                                                                                                                                                                                         * response status to 500 (Internal Server Error) and sends a JSON response with
                                                                                                                                                                                         * the error message.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If the query is successful and returns one or more records, the callback
                                                                                                                                                                                         * function sends a JSON response with the data.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If the query is successful but returns no records, the callback function sends a
                                                                                                                                                                                         * JSON response with a null value for the data.
                                                                                                                                                                                         */
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
/**
                                                                                                                                                                                         * This method is a JavaScript arrow function that takes two parameters: `req` and
                                                                                                                                                                                         * `res`. It retrieves the `id_usuario` from the request body and assigns it to a
                                                                                                                                                                                         * variable. It also retrieves the `IVA` value from the environment variables.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * The method then logs the `id_usuario` to the console. It constructs an SQL query
                                                                                                                                                                                         * to select data from the `carritos` and `productos` tables, joining them on the
                                                                                                                                                                                         * `id_producto` and `producto_id` columns respectively. The query filters the
                                                                                                                                                                                         * results based on the `usuario_id` parameter.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * The method executes the SQL query using the `connection.query` method, passing
                                                                                                                                                                                         * the `id_usuario` as a parameter. If an error occurs during the query execution,
                                                                                                                                                                                         * it sends a 500 status response with the error message. Otherwise, it iterates
                                                                                                                                                                                         * over the query result and converts the `img` property to a string if it exists.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * Finally, the method sends a JSON response containing the query result data and
                                                                                                                                                                                         * the `IVA` value.
                                                                                                                                                                                         */
router.post('/obtener_carrito', (req, res) => {
  const id_usuario = req.body.id_usuario;
  iva = process.env.IVA;
  console.log(id_usuario);
  const sql = "SELECT id_carrito, id_producto, img, nombre, precio, carritos.cantidad, carritos.total FROM carritos, productos WHERE productos.id_producto = carritos.producto_id AND usuario_id = ?";
  connection.query(sql, [id_usuario], (error, result) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      /**
                                                                                                                                                                                                 * The method takes an object as a parameter and checks if the object has a
                                                                                                                                                                                                 * property called "img". If the "img" property exists, it converts its value to a
                                                                                                                                                                                                 * string.
                                                                                                                                                                                                 */
      result.forEach(element => {
        if (element.img) {
          element.img = element.img.toString();
        }
      });
      res.json({ data: result, iva });
    }
  });
});
router.post('/obtener_iva', (req, res) => {
  res.json({ iva: process.env.IVA });
});

router.post('/update_producto', (req, res) => {
  const { codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img, id_producto } = req.body;
  let sql;
  let values;
  if (img) {
    sql = "UPDATE `productos` SET `codigo`=?,`tag`=?,`proveedor_id`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medida`=?, `precio`=?,`cantidad`=?,`total`=?,`img`=? WHERE id_producto=?";
    values = [codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img, id_producto];
  } else {
    sql = "UPDATE `productos` SET `codigo`=?,`tag`=?,`proveedor_id`=?, `categoria_id`=?,`nombre`=?,`descripcion`=?,`medida`=?, `precio`=?,`cantidad`=?,`total`=? WHERE id_producto=?";
    values = [codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, id_producto];
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
router.post('/update_usuario', (req, res) => {
  const { codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img, id_producto } = req.body;
  sql = "UPDATE `productos` SET `codigo`=?,`tag`=?,`proveedor_id`=?,`categoria_id`=?,`nombre`=?,`descripcion`=?,`medida`=?, `precio`=?,`cantidad`=?,`total`=?,`img`=? WHERE id_producto=?";
  values = [codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img, id_producto];
  /**
                                                                                                                                                                                             * This method is a callback function that handles the error and results of a
                                                                                                                                                                                             * database operation. It takes two parameters: "error" and "results".
                                                                                                                                                                                             * 
                                                                                                                                                                                             * If an error occurs, it will be logged to the console. If the error message
                                                                                                                                                                                             * indicates a duplicate entry for the "codigo" or "tag" fields, a corresponding
                                                                                                                                                                                             * error message will be sent as a JSON response with a 500 status code.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * If no error occurs, and there are results available, the "id_producto" will be
                                                                                                                                                                                             * logged to the console and a success message will be sent as a JSON response.
                                                                                                                                                                                             */
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
  const { codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img } = req.body;
  const sql = "INSERT INTO `productos`(`codigo`, `tag`,`proveedor_id`,`categoria_id`,`nombre`,`descripcion`,`medida`,`precio`,`cantidad`,`total`,`img`, `fecha`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
  /**
                                                                                                                                                                                             * This method takes two parameters: `error` and `results`. It is a callback
                                                                                                                                                                                             * function that handles the response of a database operation.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * If an error occurs, the method checks the error message to determine the type of
                                                                                                                                                                                             * error. If the error message indicates a duplicate entry for the `codigo` field,
                                                                                                                                                                                             * it sends a response with a status code of 500 and a JSON object containing an
                                                                                                                                                                                             * error message stating that the code already exists. If the error message
                                                                                                                                                                                             * indicates a duplicate entry for the `tag` field, it sends a similar response
                                                                                                                                                                                             * with an error message stating that the tag already exists.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * If no error occurs, the method checks if there are any results. If there are, it
                                                                                                                                                                                             * sends a response with a JSON object containing a success message stating that
                                                                                                                                                                                             * the data was saved successfully.
                                                                                                                                                                                             */
  connection.query(sql, [codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img, `${year}-${month}-${day}`], (error, results) => {
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
router.post('/insertar_usuario', (req, res) => {
  const currentDate = new Date(Date.now());
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const { perfiles, ciudades, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img } = req.body;
  const sql = "INSERT INTO usuarios (perfil_id, ciudad_id, usuario, contrasena, nombre, direccion, identificacion, correo, telefono, fecha, estado) VALUES (?, 1, 'nombre_usuario', 'contrasena', 'Nombre Completo', 'Dirección', 'identificacion123', 'correo@example.com', '1234567890', '2023-09-02', 'Activo');";
  connection.query(sql, [codigo, tag, proveedor, categoria, nombre, descripcion, medida, precio, cantidad, total, img, `${year}-${month}-${day}`], (error, results) => {
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
/**
                                                                                                                                                                                         * This method is used to insert a new record into the "kardex" table in a
                                                                                                                                                                                         * database. It takes in the request and response objects as parameters.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * Parameters:
                                                                                                                                                                                         * - req: The request object containing the data to be inserted.
                                                                                                                                                                                         * - res: The response object used to send a response back to the client.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * Request Body:
                                                                                                                                                                                         * - idproducto: The ID of the product.
                                                                                                                                                                                         * - cantidad: The quantity of the product.
                                                                                                                                                                                         * - total: The total price of the product.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * The method executes an SQL query to insert the data into the "kardex" table. The
                                                                                                                                                                                         * query uses placeholders (?) to prevent SQL injection and accepts the following
                                                                                                                                                                                         * values:
                                                                                                                                                                                         * - idproducto: The ID of the product.
                                                                                                                                                                                         * - Date(): The current date and time.
                                                                                                                                                                                         * - "salida": The type of movement (in this case, "salida" represents an outgoing
                                                                                                                                                                                         * movement).
                                                                                                                                                                                         * - cantidad: The quantity of the product.
                                                                                                                                                                                         * - total: The total price of the product.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If an error occurs during the execution of the query, the error message is
                                                                                                                                                                                         * logged and sent back as a response to the client.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If the query is successful and returns results, a success message is sent back
                                                                                                                                                                                         * as a response.
                                                                                                                                                                                         * 
                                                                                                                                                                                         * If the query is successful but does not return any results, a "No found" message
                                                                                                                                                                                         * is sent back as a response.
                                                                                                                                                                                         */
router.post('/insertar_salida', (req, res) => {
  const { idproducto, cantidad, total } = req.body;
  const sql = "INSERT INTO `kardex` (`producto_id`,`fecha`,`tipo_mov`,`cantidad`,`precio_total`) VALUES(?, ?, ?, ?, ?);";
  /**
                                                                                                                                                                                             * This is a callback function that takes two parameters: "error" and "results". It
                                                                                                                                                                                             * is typically used in asynchronous operations to handle the response or error
                                                                                                                                                                                             * returned by the operation.
                                                                                                                                                                                             * 
                                                                                                                                                                                             * If an error is present, it will be logged to the console and a response with the
                                                                                                                                                                                             * error message will be sent. If there is no error, it will check if there are
                                                                                                                                                                                             * any results. If there are results, a response with the message "Success" will
                                                                                                                                                                                             * be sent. If there are no results, a response with the message "Not found" will
                                                                                                                                                                                             * be sent.
                                                                                                                                                                                             */
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
            connection.query(sql, [id_producto, `${year}-${month}-${day}`, detalle, cantidad, precio, total, selectResult[0]['cantidad'], precio, (selectResult[0]['cantidad'] * precio)], (error, insertResult) => {
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
            connection.query(sql, [id_producto, `${year}-${month}-${day}`, detalle, cantidad, precio, total, selectResult[0]['cantidad'], precio, (selectResult[0]['cantidad'] * precio)], (error, insertResult) => {
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
    const sql = "SELECT id_producto, img, productos.nombre , medida, categoria, cantidad, precio, descripcion FROM productos LEFT JOIN categorias ON productos.categoria_id = categorias.id_categoria LEFT JOIN proveedores ON productos.proveedor_id = proveedores.id_proveedor;";
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
    const sql = "SELECT id_producto, img, productos.nombre , medida, categoria, cantidad, precio, descripcion FROM productos,categorias WHERE productos.categoria_id= categorias.id_categoria AND id_producto = ?";
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

/**
                                                                                                                                                                                                         * This is an asynchronous function that handles a login request. It takes in a
                                                                                                                                                                                                         * request object (req) and a response object (res) as parameters.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * The function first extracts the username and password from the request body
                                                                                                                                                                                                         * using destructuring assignment.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * Then, it constructs a SQL query to select user information from the database
                                                                                                                                                                                                         * based on the provided username and a specific profile ID. The query joins
                                                                                                                                                                                                         * multiple tables to retrieve additional information about the user.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * The function executes the query using the connection object and handles any
                                                                                                                                                                                                         * errors that may occur during the execution. If an error occurs, it sends a JSON
                                                                                                                                                                                                         * response with an error message and a status code of 500.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * If the query returns no results, it sends a JSON response indicating that the
                                                                                                                                                                                                         * username and/or password are incorrect.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * If the query returns a result, it compares the provided password with the hashed
                                                                                                                                                                                                         * password stored in the database using the bcrypt.compare() function. If the
                                                                                                                                                                                                         * passwords match, it checks if the user's account is validated. If the account
                                                                                                                                                                                                         * is not validated, it sends a JSON response with a warning message and the
                                                                                                                                                                                                         * user's email.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * If the passwords do not match, it sends a JSON response indicating that the
                                                                                                                                                                                                         * username and/or password are incorrect.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * If the passwords match and the account is validated, it sets the user's
                                                                                                                                                                                                         * information in the session object and sends a JSON response with a success
                                                                                                                                                                                                         * message.
                                                                                                                                                                                                         * 
                                                                                                                                                                                                         * The function uses the async/await syntax to handle asynchronous operations and
                                                                                                                                                                                                         * ensure that the response is sent only after the database query and password
                                                                                                                                                                                                         * comparison are completed.
                                                                                                                                                                                                         */
router.post("/validar_cliente", async (req, res) => {
  const { usuario, contrasena } = req.body
  const query = 'SELECT *FROM `usuarios`LEFT JOIN `perfiles` ON `perfil_id` = `perfiles`.`id_perfil` LEFT JOIN `ciudades` ON `ciudad_id` = `ciudades`.`id_ciudad` LEFT JOIN `provincias` ON `ciudades`.`provincia_id` = `provincias`.`id_provincia` WHERE `usuarios`.`usuario` = ? AND perfil_id = 2';
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
  const query = 'SELECT *FROM `usuarios`LEFT JOIN `perfiles` ON `perfil_id` = `perfiles`.`id_perfil` LEFT JOIN `ciudades` ON `ciudad_id` = `ciudades`.`id_ciudad` LEFT JOIN `provincias` ON `ciudades`.`provincia_id` = `provincias`.`id_provincia` WHERE `usuarios`.`usuario` = ? AND (perfil_id = 1 OR perfil_id =3)';
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
      /**
                                                                                                                                                                                                                 * This method takes two parameters: `err` and `match`. It is a callback function
                                                                                                                                                                                                                 * that handles the result of a user authentication process.
                                                                                                                                                                                                                 * 
                                                                                                                                                                                                                 * If an error occurs (`err` is truthy), it sends a response with a status code of
                                                                                                                                                                                                                 * 500 and a JSON object containing an error message indicating incorrect username
                                                                                                                                                                                                                 * and/or password.
                                                                                                                                                                                                                 * 
                                                                                                                                                                                                                 * If the authentication is successful (`match` is truthy), it sets the
                                                                                                                                                                                                                 * `req.session.credentials` object with the authenticated user's information and
                                                                                                                                                                                                                 * sends a response with a status code of 200 and a JSON object containing a
                                                                                                                                                                                                                 * success message.
                                                                                                                                                                                                                 * 
                                                                                                                                                                                                                 * If the authentication fails (`match` is falsy), it sends a response with a
                                                                                                                                                                                                                 * status code of 500 and a JSON object containing an error message indicating
                                                                                                                                                                                                                 * incorrect username and/or password.
                                                                                                                                                                                                                 * 
                                                                                                                                                                                                                 * Additionally, it logs appropriate messages to the console for debugging purposes.
                                                                                                                                                                                                                 */
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
