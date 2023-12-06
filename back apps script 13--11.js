// Accede a la hoja de cálculo activa en Google Sheets.
var ss = SpreadsheetApp.getActiveSpreadsheet();

// Función que maneja las solicitudes POST HTTP.
function doPost(e) {
  // Verifica si el evento 'e' o los datos POST están presentes.
  if (!e || !e.postData) {
    // Si no, devuelve un mensaje de error.
    return ContentService.createTextOutput('Solicitud POST inválida o faltan datos').setMimeType(ContentService.MimeType.TEXT);
  }
  // Registra en el log la fecha y hora de la solicitud.
  Logger.log("Funcion doPost Ingreso : la fecha y hora: " + new Date());
  // Parsea el contenido de la solicitud POST como JSON.
  var operacion = JSON.parse(e.postData.contents);
  var respuesta = "";

  // Maneja diferentes operaciones basadas en el valor de 'op'.
  if (operacion.op == "configuracion") {
    // Si la operación es 'configuracion', llama a la función 'listar_configuracion'.
    respuesta = listar_configuracion();
    // Si se proporciona un ID, realiza operaciones adicionales.
    if (operacion.id) {
      var respuesta_pedido = JSON.parse(cargar_venta(JSON.stringify(operacion)));
      if (respuesta_pedido.status == "0") {
        var json_resultado = JSON.parse(respuesta);
        json_resultado.pedido = respuesta_pedido.pedido;
        respuesta = JSON.stringify(json_resultado);
      }
    }
  }
  // Si la operación es 'cargar_venta', llama a la función 'cargar_venta'.
  if (operacion.op == "cargar_venta") {
    respuesta = cargar_venta(JSON.stringify(operacion));
  }
  // Si la operación es 'venta', llama a la función 'registrar_venta'.
  if (operacion.op == "venta") {
    respuesta = registrar_venta(JSON.stringify(operacion));
  }
  // Si la operación es 'pagar', llama a la función 'pagar_venta'.
  if (operacion.op == "pagar") {
    respuesta = pagar_venta(JSON.stringify(operacion));
  }
  // Devuelve la respuesta en formato JSON.
  return ContentService.createTextOutput(respuesta).setMimeType(ContentService.MimeType.JSON);
}

// Función para cargar detalles de una venta.
function cargar_venta(informacion) {
  var result, jo = {};
  try {
    // Parsea la información de la venta proporcionada.
    var venta = JSON.parse(informacion);
    // Accede a la hoja 'Venta'.
    var sheet = ss.getSheetByName("Venta");
    // Limpia el ID de la venta de parámetros URL no deseados.
    venta.id = venta.id.replace("&m=1", "").replace("?m=1", "");
    // Obtiene los datos de la hoja 'Venta'.
    var rows_agencia = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var pedido_ = "";
    // Busca la venta correspondiente al ID proporcionado.
    for (var i = 0, l = rows_agencia.length; i < l; i++) {
      var dataRow = rows_agencia[i];
      if ((dataRow[0] + "") === (venta.id + "")) {
        pedido_ = JSON.parse(dataRow[11]);
        break;
      }
    }
    // Si se encuentra el pedido, prepara la respuesta.
    if (pedido_) {
      jo.status = '0';
      jo.message = ' OK ';
      jo.pedido = pedido_;
      jo.pedido.idpedido = venta.id;
    } else {
      // Si no se encuentra el pedido, devuelve un mensaje de error.
      jo.status = '1';
      jo.message = ' No se encontro el pedido ' + venta.id;
    }
  } catch (e) {
    // Maneja cualquier error durante el proceso.
    jo.status = '-1';
    jo.message = e.toString();
  }
  var result = JSON.stringify(jo);
  return result;
}

// Función para listar todas las ventas.
function listar_ventas() {
  // Accede a la hoja 'Venta'.
  var sheet = ss.getSheetByName("Venta");
  // Obtiene todos los datos de la hoja.
  var rows = sheet.getDataRange().getValues();
  // Mapea cada fila a un objeto con los detalles de la venta.
  var ventas = rows.slice(1).map(function (row) {
    return {
      codigo: row[0],
      fecha: row[1],
      hora: row[2],
      nombre: row[3],
      documento: row[4],
      telefono: row[5],
      correo: row[6],
      direccion: row[7],
      agencia: row[8],
      moneda: row[9],
      total: row[10],
      json: row[11],
      costoEnvioAgencia: row[12],
      tiempoEntregaAgencia: row[13],
      estado: row[14],
      jsonBackup: row[15],
      provincia: row[16],
      localidad: row[17],
      codPostal: row[18],
      transporteSugerido: row[19]
    };
  });
  // Devuelve las ventas en formato JSON.
  return JSON.stringify({ status: '0', message: 'Exito', ventas: ventas });
}

// Función para procesar el pago de una venta.
function pagar_venta(informacion) {
  var result, jo = {};
  try {
    // Parsea la información de la venta proporcionada.
    var venta = JSON.parse(informacion);
    // Accede a la hoja 'Venta'.
    var sheet = ss.getSheetByName("Venta");
    // Obtiene los datos de la hoja 'Venta'.
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    // Busca la venta correspondiente al ID proporcionado.
    var filtronumero = rows.findLast(function (row) {
      return (row[0] + "") == "" + venta.idpedido;
    });

    // Configura el mensaje de éxito.
    jo.status = '0';
    jo.message = ' Se pago la venta exitoisamente';
    // Llama a la función 'notificarmeta' (no definida en este fragmento de código).
    notificarmeta("pago_confirmado", filtronumero[9] + " " + filtronumero[10], filtronumero[5], "", "", "", "");

    // Encuentra el índice de la fila a actualizar.
    var fila_actualizar = rows.findLastIndex(function (row) {
      return (row[0] + "") == "" + venta.idpedido;
    });
    // Actualiza el estado de la venta a 'PAGADO'.
    sheet.getRange(fila_actualizar + 2, 15).setValue("PAGADO");

  } catch (e) {
    // Maneja cualquier error durante el proceso.
    jo.status = '-1';
    jo.message = e.toString();
  }
  var result = JSON.stringify(jo);
  return result;
}

// Función para registrar una nueva venta o editar una existente.
function registrar_venta(informacion) {
  var result, jo = {};
  try {
    // Parsea la información de la venta proporcionada.
    var venta = JSON.parse(informacion);
    // Accede a las hojas 'Venta', 'DetalleVenta' y 'Configuracion'.
    var sheet = ss.getSheetByName("Venta");
    var sheetdetalle = ss.getSheetByName("DetalleVenta");
    var sheet_conf = ss.getSheetByName("Configuracion");
    // Genera un nuevo código de venta.
    var codigoventa = Utilities.getUuid();
    var backup_edicion = "";

    // Si la operación es una edición y se proporciona un ID, realiza la edición.
    if (venta.operacion == "e" && venta.id) {
      codigoventa = venta.id;
      var rows_venta = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
      var rows_detalleventa = sheetdetalle.getRange(2, 1, sheetdetalle.getLastRow() - 1, sheetdetalle.getLastColumn()).getValues();
      // Elimina la venta y los detalles de la venta existentes.
      for (var il = rows_venta.length - 1; il >= 0; il--) {
        if (codigoventa == rows_venta[il][0]) {
          backup_edicion = rows_venta[il][11];
          sheet.deleteRow(il + 2);
          break;
        }
      }
      for (var il = rows_detalleventa.length - 1; il >= 0; il--) {
        if (codigoventa == rows_detalleventa[il][0]) {
          sheetdetalle.deleteRow(il + 2);
        }
      }
    }

    // Obtiene la fecha y hora actuales.
    var fecha = Utilities.formatDate(new Date(), "GMT", "dd/mm/yyyy");
    var hora = Utilities.formatDate(new Date(), "GMT", "HH:mm:ss");

    // Obtiene información de la agencia de entrega.
    var agencia = venta.agencia_entrega || "No especificado";
    var costo_agencia = "";
    var tiempo_agencia = "";
    var sheet_agencia = ss.getSheetByName("Agencia");
    var rows_agencia = sheet_agencia.getRange(2, 1, sheet_agencia.getLastRow() - 1, sheet_agencia.getLastColumn()).getValues();
    for (var i = 0, l = rows_agencia.length; i < l; i++) {
      if (rows_agencia[i][0] == agencia) {
        costo_agencia = rows_agencia[i][1];
        tiempo_agencia = rows_agencia[i][2];
        break;
      }
    }

    // Obtiene información adicional de la venta.
    var provincia = venta.provincia_entrega || "Valor predeterminado o vacío";
    var localidad = venta.localidad_entrega || "Valor predeterminado o vacío";
    var codPostal = venta.codpostal_entrega || "Valor predeterminado o vacío";
    var transporteSugerido = venta.transporte_sugerido || "Valor predeterminado o vacío";

    // Añade la nueva venta a la hoja 'Venta'.
    sheet.appendRow([
      codigoventa, fecha, hora, venta.nombre_entrega, venta.rut_entrega, venta.telefono_entrega,
      venta.correo_entrega, venta.direccion_entrega, agencia, venta.moneda, venta.total,
      JSON.stringify(venta), costo_agencia, tiempo_agencia, "SOLICITADO", backup_edicion,
      provincia, localidad, codPostal, transporteSugerido
    ]);

    var detalle_pedido = "";
    var detalle_pedido_meta = "";

    // Procesa cada detalle de la venta.
    for (var i = 0; i < venta.detalle.length; i++) {
      var item = venta.detalle[i];
      item.nombre = item.nombre.replace("<b>", "").replace("</b>", "");
      detalle_pedido += item.nombre + " Cant: " + item.cantidad + " x " + item.precio + " = " + item.moneda + "" + item.total + "\n";
      detalle_pedido_meta += item.nombre + " - " + item.moneda + "" + item.total + "\\n";
      sheetdetalle.appendRow([codigoventa, item.nombre, item.categoria, item.cantidad, item.precio, item.total]);
    }

    // Configura el mensaje de éxito.
    jo.status = '0';
    if (venta.operacion == "e" && venta.id) {
      jo.message = 'Se editó la venta exitosamente';
    } else {
      jo.message = 'Se grabó la venta exitosamente';
    }

    // Prepara un mensaje para WhatsApp con los detalles de la venta.
    jo.message_whatsapp = 'Pedido: ' + venta.url + '?o=d&id=' + codigoventa + '\n';
    jo.message_whatsapp += '*NOMBRE Y APELLIDOS:*\n';
    jo.message_whatsapp += venta.nombre_entrega + "\n";
    jo.message_whatsapp += '*DOCUMENTO:*\n';
    jo.message_whatsapp += venta.rut_entrega + "\n";
    jo.message_whatsapp += '*TELEFONO:*\n';
    jo.message_whatsapp += venta.telefono_entrega + "\n";
    jo.message_whatsapp += '*CORREO:*\n';
    jo.message_whatsapp += venta.correo_entrega + "\n";
    jo.message_whatsapp += '*DIRECCION:*\n';
    jo.message_whatsapp += venta.direccion_entrega + "\n";
    jo.message_whatsapp += '*Forma Envio:*\n';
    jo.message_whatsapp += agencia + "\n";
    jo.message_whatsapp += '*Provincia:*\n';
    jo.message_whatsapp += provincia + "\n";
    jo.message_whatsapp += '*Localidad:*\n';
    jo.message_whatsapp += localidad + "\n";
    jo.message_whatsapp += '*Código Postal:*\n';
    jo.message_whatsapp += codPostal + "\n";
    jo.message_whatsapp += '*Transporte Sugerido:*\n';
    jo.message_whatsapp += transporteSugerido + "\n";
    jo.message_whatsapp += '*PEDIDO:*\n';
    jo.message_whatsapp += detalle_pedido;
    jo.message_whatsapp += '*Total pedido:*' + venta.moneda + "" + venta.total + "\n";

  } catch (e) {
    // Maneja cualquier error durante el proceso.
    jo.status = '-1';
    jo.message = e.toString();
  }
  var result = JSON.stringify(jo);
  return result;
}


function listar_configuracion() {
  var result, jo = {}; // Inicializa 'result' y un objeto 'jo' vacío.
  var dataArray = []; // Inicializa un arreglo vacío para almacenar los productos.
  var dataArrayAgencia = []; // Inicializa un arreglo vacío para almacenar las agencias.
  var sheet_p = ss.getSheetByName("Producto"); // Obtiene la hoja de cálculo llamada "Producto".
  var rows_p = sheet_p.getRange(2, 1, sheet_p.getLastRow() - 1, sheet_p.getLastColumn()).getValues(); // Obtiene los valores de la hoja "Producto".

  var sheet_agencia = ss.getSheetByName("Agencia"); // Obtiene la hoja de cálculo llamada "Agencia".
  var rows_agencia = sheet_agencia.getRange(2, 1, sheet_agencia.getLastRow() - 1, sheet_agencia.getLastColumn()).getValues(); // Obtiene los valores de la hoja "Agencia".

  // Itera sobre cada fila de la hoja "Agencia" y almacena los datos en 'dataArrayAgencia'.
  for (var i = 0, l = rows_agencia.length; i < l; i++) {
      var dataRow = rows_agencia[i];
      var record = {};
      record['codigo'] = dataRow[0];
      record['descripcion'] = dataRow[0];
      dataArrayAgencia.push(record);
  }

  var categoria = "";
  var nombre_producto = "";
  var record = {};
  var dataArray_producto = [];

  var contador_categoria = 0;
  var sheet_conf = ss.getSheetByName("Configuracion");
  var moneda = sheet_conf.getRange(8, 2).getValue(); // Obtiene el valor de la moneda desde la hoja "Configuracion".
  
  var record_producto = {};

  // Itera sobre cada fila de la hoja "Producto".
  for (var j = 0; j < rows_p.length; j++) {
      var dataRow_producto = rows_p[j];

      // Salta la fila si la columna "Ocultar" tiene el valor "si".
      if (dataRow_producto[8] && dataRow_producto[8].toLowerCase() === "si") {
          continue;
      }

      // Salta la fila si ciertos campos están vacíos.
      if (!dataRow_producto[0] || !dataRow_producto[1] || !dataRow_producto[5]) {
          continue;
      }

      // Agrupa productos por categoría.
      if (dataRow_producto[5] != categoria) {
          if (categoria) {
              record = {};
              record['codigo'] = contador_categoria;
              record['nombre'] = categoria;
              record['producto'] = dataArray_producto;
              dataArray.push(record);
              dataArray_producto = [];
          }
          categoria = dataRow_producto[5];
          contador_categoria = contador_categoria + 1;
      }

      // Crea un objeto para cada variedad de producto.
      var variedades = { "moneda": moneda, "precio": dataRow_producto[4], "variedad": dataRow_producto[2], "minima": dataRow_producto[7], "sub_variedad": dataRow_producto[3] };
      if (nombre_producto != dataRow_producto[0]) {
          record_producto = {};
          record_producto['codigo'] = (j + 1);
          record_producto['categoria'] = dataRow_producto[5];
          record_producto['nombre'] = dataRow_producto[0];
          record_producto['descripcion'] = dataRow_producto[1];
          record_producto['imagen'] = dataRow_producto[6];
          var dataArray_variedad = [];
          dataArray_variedad.push(variedades);
          record_producto.variedad = dataArray_variedad;
          dataArray_producto.push(record_producto);
          nombre_producto = dataRow_producto[0];
      } else {
          try {
              record_producto.variedad.push(variedades);
          } catch (e) {
          }
      }

      // Al final del bucle, agrega el último grupo de productos a 'dataArray'.
      if ((j + 1) == rows_p.length) {
          record = {};
          record['codigo'] = contador_categoria;
          record['nombre'] = categoria;
          record['producto'] = dataArray_producto;
          dataArray.push(record);
      }
  }

  // Configura el objeto 'jo' con los datos recopilados y configuraciones adicionales.
  jo.status = '0';
  jo.message = 'Exito';
  jo.pagina_logo = sheet_conf.getRange(1, 2).getValue();
  jo.pagina_nombre = sheet_conf.getRange(2, 2).getValue();
  jo.pagina_url = sheet_conf.getRange(3, 2).getValue();
  jo.pagina_carrusel = JSON.parse(sheet_conf.getRange(4, 2).getValue());
  jo.contactabilidad = sheet_conf.getRange(7, 2).getValue();
  jo.nombre_empresa = sheet_conf.getRange(9, 2).getValue();
  jo.content = dataArray;
  jo.contentagencia = dataArrayAgencia;

  // Convierte el objeto 'jo' a una cadena JSON y lo retorna.
  var result = JSON.stringify(jo);
  return result;
}

