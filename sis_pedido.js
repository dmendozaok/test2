// Define la URL final para realizar operaciones de venta.
var url_final_venta = "https://script.google.com/macros\\s\\AKfycbzuHZ3UZZes_sRM5iR4zUXWa30-43JGUQxW60f02pyfI3Mkm2rR-ypU8yLb1TdcHuKw/";

// Inicializa variables para almacenar la operación y el ID del pedido.
var operacion = "";
var idpedido = "";

// Bloque try-catch para manejar excepciones.
try {
    // Crea un objeto URLSearchParams para manejar los parámetros de la URL.
    var params = new URLSearchParams(location.search);

    // Obtiene los valores de los parámetros 'o' (operación) y 'id' (ID del pedido) de la URL.
    operacion = params.get("o");
    idpedido = params.get("id");

    // Imprime en consola los valores obtenidos.
    console.log("id::" + idpedido);
    console.log("operacion::" + operacion);

    // Verifica si 'operacion' o 'idpedido' son indefinidos o nulos y los establece como cadenas vacías.
    if (operacion == undefined || operacion == null) {
        operacion = "";
    }
    if (idpedido == undefined || idpedido == null) {
        idpedido = "";
    }
} catch (e) {
    // Imprime en consola cualquier error que ocurra en el bloque try.
    console.log(e);
}

// Función que se ejecuta cuando el documento está listo.
$(document).ready(function () {

    // Condición que verifica el valor de 'operacion'.
    if (operacion == "" || operacion == "e") {
        // Muestra y oculta elementos de la interfaz según la operación.
        $("#navbarfooter").show();
        $(".detalle_pedido_page").hide();
        $(".principal").show();
        $(".pedido_producto").hide();
        $("#btn_cars").show();
        $("#btn_regresar").hide();
        $("#filtro_producto").hide();

        // Llama a funciones para inicializar la venta y listar la configuración.
        inicializarVenta();
        listar_configuracion(idpedido, operacion);

        // Condición para mostrar u ocultar botones de edición y nuevo.
        if (operacion == "e") {
            $("#btn_edicion").show();
            $("#btn_nuevo").hide();
        } else {
            $("#btn_edicion").hide();
            $("#btn_nuevo").show();
        }

        // Manejador de eventos para el formulario de pedido.
        $('#form_pedido').submit(function (event) {
            // Previene el envío tradicional del formulario.
            event.preventDefault();

            // Obtiene la venta desde el almacenamiento local y verifica si hay detalles.
            var venta = JSON.parse(localStorage.getItem('venta'));
            if (venta.detalle.length == 0) {
                Swal.fire("Warning!", "Debe agregar productos al pedido!", "warning");
            } else {
                // Obtiene la configuración y prepara los datos de la venta.
                var config = JSON.parse(localStorage.getItem('configuracion_pagina'));
                venta.op = "venta";
                venta.operacion = operacion;
                venta.id = idpedido;
                // Recoge los valores del formulario.
                venta.nombre_entrega = $('#txt_nombre').val();
                // ... (continúa recogiendo valores del formulario)

                // Muestra un cargador.
                $(".loader-wrapper").fadeIn("slow", function () {
                    // Realiza una petición AJAX para procesar la venta.
                    $.ajax({
                        url: url_final_venta + "exec",
                        jsonp: "callback",
                        method: 'POST',
                        data: JSON.stringify(venta),
                        async: false,
                        success: function (respuesta) {
                            // Maneja la respuesta de la petición.
                            if (respuesta.status == '0') {
                                // Realiza acciones en caso de éxito.
                                regresar_principal();
                                inicializarVenta();
                                total_pedido();
                                $('#btn_cerrar').click();
                                $("#form_pedido").trigger("reset");
                                Swal.fire("Exito!", respuesta.message, "success");
                                // Envía un mensaje de WhatsApp si es necesario.
                                if (respuesta.message_whatsapp) {
                                    window.location.href = "https://wa.me/" + config.contactabilidad + "?text=" + encodeURIComponent(respuesta.message_whatsapp);
                                }
                            } else {
                                // Muestra una advertencia en caso de error.
                                Swal.fire("Warning!", respuesta.message, "warning");
                            }
                        },
                        complete: function (data) {
                            // Oculta el cargador al completar la petición.
                            console.log("complete:function");
                            $(".loader-wrapper").fadeOut("slow");
                        }
                    });
                });
            }
            event.preventDefault();
            return false;
        });

    } else {
        // Muestra y oculta elementos de la interfaz según la operación.
        $(".detalle_pedido_page").show();
        $("#navbarfooter").hide();
        $(".principal").hide();
        $(".pedido_producto").hide();

        $("#btn_pagar").hide();

        // Condición para mostrar el botón de pagar.
        if (operacion == "p") {
            $("#btn_pagar").show();
        }

        // Manejador de eventos para el botón de pagar.
        $('#btn_pagar').click(function () {
            // Muestra un cargador.
            $(".loader-wrapper").fadeIn("slow", function () {
                // Realiza una petición AJAX para procesar el pago.
                $.ajax({
                    url: url_final_venta + "exec",
                    jsonp: "callback",
                    method: 'POST',
                    data: JSON.stringify({ op: "pagar", idpedido: idpedido }),
                    async: false,
                    success: function (respuesta) {
                        // Maneja la respuesta de la petición.
                        if (respuesta.status == '0') {
                            Swal.fire("Exito!", respuesta.message, "success");
                        } else {
                            Swal.fire("Alerta!", respuesta.message, "warning");
                        }
                    },
                    complete: function (data) {
                        // Oculta el cargador al completar la petición.
                        console.log("complete:function");
                        $(".loader-wrapper").fadeOut("slow");
                    }
                });
            });
        });

        // Manejador de eventos para el botón de editar.
        $('#btn_editar').click(function () {
            // Muestra un diálogo de confirmación.
            Swal.fire({
                title: 'Desea grabar el pedido editado?',
                showCancelButton: true,
                confirmButtonText: 'Enviar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Prepara los datos para la edición del pedido.
                    venta.op = "confirmar";
                    venta.idpedido = idpedido;
                    // Muestra un cargador.
                    $(".loader-wrapper").fadeIn("slow", function () {
                        // Realiza una petición AJAX para confirmar la edición.
                        $.ajax({
                            url: url_final_venta + "exec",
                            jsonp: "callback",
                            method: 'POST',
                            data: JSON.stringify(venta),
                            async: false,
                            success: function (respuesta) {
                                // Maneja la respuesta de la petición.
                                if (respuesta.status == '0') {
                                    Swal.fire("Exito!", respuesta.message, "success");
                                } else {
                                    Swal.fire("Alerta!", respuesta.message, "warning");
                                }
                            },
                            complete: function (data) {
                                // Oculta el cargador al completar la petición.
                                console.log("complete:function");
                                $(".loader-wrapper").fadeOut("slow");
                            }

                        });
                    });
                }
            });
        });

        // Carga los detalles del pedido al iniciar.
        $(".loader-wrapper").fadeIn("slow", function () {
            $.ajax({
                url: url_final_venta + "exec",
                jsonp: "callback",
                method: 'POST',
                data: JSON.stringify({ op: "cargar_venta", id: idpedido }),
                async: false,
                success: function (respuesta) {
                    // Maneja la respuesta de la petición.
                    if (respuesta.status == '0') {
                        cargar_detalle_pedido(operacion, JSON.stringify(respuesta.pedido));
                    } else {
                        Swal.fire("Warning!", respuesta.message, "warning");
                    }
                },
                complete: function (data) {
                    // Oculta el cargador al completar la petición.
                    console.log("complete:function");
                    $(".loader-wrapper").fadeOut("slow");
                }

            });
        });
    }

    // Oculta el cargador inicial.
    $(".loader-wrapper").fadeOut("slow");

});





 

  function cargar_detalle_pedido(operacion, detalle) { 
// Convierte la cadena 'detalle' (en formato JSON) en un objeto JavaScript.
var pedido = JSON.parse(detalle);

// Inicia la construcción de una cadena HTML para mostrar el título del detalle del pedido.
var detalle_pedido = '<li class="list-group-item  margen_0 detalle_titulo" style="margin-top: 10px;">DETALLE PEDIDO : ' + pedido.idpedido + '</li>';

// Añade a la cadena HTML la información del nombre y apellidos del cliente.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Nombre y Apellidos: ' + pedido.nombre_entrega + '</li>';

// Añade el documento o identificación del cliente.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Documento : ' + pedido.rut_entrega + '</li>';

// Añade el teléfono del cliente.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Telefono : ' + pedido.telefono_entrega + '</li>';

// Añade el correo electrónico del cliente.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Correo : ' + pedido.correo_entrega + '</li>';

// Añade la dirección de entrega.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Direccion : ' + pedido.direccion_entrega + '</li>';

// Añade la provincia de entrega, o 'No especificado' si no está definida.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Provincia : ' + (pedido.provincia_entrega || 'No especificado') + '</li>';

// Añade la localidad de entrega, o 'No especificado' si no está definida.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Localidad : ' + (pedido.localidad_entrega || 'No especificado') + '</li>';

// Añade el código postal, o 'No especificado' si no está definido.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Código Postal : ' + (pedido.codpostal_entrega || 'No especificado') + '</li>';

// Añade el transporte sugerido, o 'No especificado' si no está definido.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Transporte Sugerido : ' + (pedido.transporte_sugerido || 'No especificado') + '</li>';

// Añade la agencia de entrega.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">Agencia : ' + pedido.agencia_entrega + '</li>';

// Comienza una lista ordenada para los detalles de los productos del pedido.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2"><ol class="list-group">';

// Itera sobre cada producto en el detalle del pedido.
for (var i = 0; i < pedido.detalle.length; i++) {
    // Añade el nombre del producto, categoría, cantidad, precio y total.
    detalle_pedido += '<li class="list-group-item d-flex justify-content-between align-items-start">';
    detalle_pedido += ' <div class="ms-2 me-auto">';
    detalle_pedido += '   <div class="fw-bold">' + pedido.detalle[i].nombre + '</div>';
    detalle_pedido += '' + pedido.detalle[i].categoria + ' <br/>';
    detalle_pedido += 'Cantidad :' + pedido.detalle[i].cantidad + ' <br/>';
    detalle_pedido += 'Precio    :' + pedido.detalle[i].moneda + "" + pedido.detalle[i].precio + ' <br/>';
    detalle_pedido += 'Sub-Total    :' + pedido.detalle[i].moneda + "" + pedido.detalle[i].total + ' <br/>';
    detalle_pedido += '</div>';

    // Añade una imagen del producto con un enlace para verla en tamaño completo.
    detalle_pedido += ' <div class="image-parent">';
    detalle_pedido += ' <a href="' + pedido.detalle[i].imagen + '" data-fancybox data-caption="' + pedido.detalle[i].nombre + '">';
    detalle_pedido += '     <img src="' + pedido.detalle[i].imagen + '" class="img-fluid" alt="quixote">';
    detalle_pedido += '     </a>';
    detalle_pedido += '     </div>';
    detalle_pedido += '</li>';
}

// Cierra la lista ordenada.
detalle_pedido += '</ol></li>';

// Añade el total del pedido.
detalle_pedido += '<li class="list-group-item  margen_0 detalle_contenido_2">TOTAL PEDIDO: ' + pedido.moneda + "" + pedido.total + '</li>';

// Actualiza el contenido HTML del elemento con ID 'pedido_parametro_producto' con los detalles del pedido.
$("#pedido_parametro_producto").html(detalle_pedido); 
}







function abrir_whatsapp() { 
  // Obtiene la configuración guardada en el almacenamiento local y la convierte de JSON a un objeto JavaScript.
  var config = JSON.parse(localStorage.getItem('configuracion_pagina'));

  // Abre una nueva ventana o pestaña del navegador con la URL de WhatsApp, utilizando el número de contacto almacenado en la configuración.
  window.open("https://wa.me/" + config.contactabilidad, '_blank');
}


function regresar_principal() {
  // Muestra el elemento con la clase 'principal'.
  $(".principal").show();

  // Oculta el elemento con la clase 'pedido_producto'.
  $(".pedido_producto").hide();

  // Muestra el botón con el ID 'btn_cars'.
  $("#btn_cars").show();

  // Oculta el botón con el ID 'btn_regresar'.
  $("#btn_regresar").hide();
}






function mostrar_cantidad(tipo, id, minima) {
  var valor = 0;

  // Intenta convertir el texto del elemento con el ID proporcionado y el valor mínimo a números enteros.
  try {
      valor = parseInt($('#' + id).text());
      minima = parseInt(minima);
  } catch (e) {
      // En caso de error, no hace nada.
  }

  // Incrementa o decrementa el valor según el tipo de acción ('agregar' o 'restar').
  if (tipo == "agregar") {
      valor = valor + 1;

      // Simula un clic en el botón de agregar al carrito para el producto específico.
      $("#agregar_carrito" + id).click();
  } else if (tipo == "restar") {
      valor = valor - 1;
  } else {
      // Si el tipo no es 'agregar' ni 'restar', resetea el valor a 0.
      valor = 0;
  }

  // Asegura que el valor no sea menor que el mínimo establecido.
  if (valor < minima) {
      valor = minima;
  }

  // Actualiza el texto del elemento con el valor calculado.
  $('#' + id).text(valor);

  // Si se agregó o restó, simula un clic en el botón de agregar al carrito.
  if (tipo == "agregar" || tipo == "restar") {
      $("#agregar_carrito" + id.replace("id_cantidad_", "")).click();
  }
}






function mostrar_pedido() {
  // Oculta el elemento con la clase 'principal'.
  $(".principal").hide();

  // Muestra el elemento con la clase 'pedido_producto'.
  $(".pedido_producto").show();

  // Oculta el botón con el ID 'btn_cars'.
  $("#btn_cars").hide();

  // Muestra el botón con el ID 'btn_regresar'.
  $("#btn_regresar").show();

  // Obtiene los datos de la venta del almacenamiento local y los convierte de JSON a un objeto JavaScript.
  var venta = JSON.parse(localStorage.getItem('venta'));

  // Inicia la construcción de una cadena HTML para mostrar los detalles del pedido en una lista ordenada.
  var detalle_pedido = '<ol class="list-group">';

  // Itera sobre cada elemento en el detalle de la venta.
  for (var i = 0; i < venta.detalle.length; i++) {
      // Añade un elemento de lista para cada producto en el detalle del pedido.
      detalle_pedido += '<li class="list-group-item d-flex justify-content-between align-items-start">';
      detalle_pedido += ' <div class="ms-2 me-auto">';
      detalle_pedido += '   <div class="fw-bold">' + venta.detalle[i].nombre + '</div>';
      detalle_pedido += 'Cantidad :' + venta.detalle[i].cantidad + ' <br/>';
      detalle_pedido += 'Precio    :' + venta.detalle[i].moneda + "" + venta.detalle[i].precio + ' <br/>';
      detalle_pedido += 'Sub-Total    :' + venta.detalle[i].moneda + "" + venta.detalle[i].total + ' <br/>';

      // Añade un botón para eliminar el detalle del pedido.
      detalle_pedido += '<span class="badge bg-danger rounded-pill" onclick="eliminar_detalle(\'' + venta.detalle[i].key_completo + '\');">Eliminar</span>';
      detalle_pedido += '</div>';

      // Añade una imagen del producto con un enlace para verla en tamaño completo.
      detalle_pedido += '     <div class="image-parent">';
      detalle_pedido += ' <a href="' + venta.detalle[i].imagen + '" data-fancybox data-caption="' + venta.detalle[i].nombre + '">';
      detalle_pedido += '     <img src="' + venta.detalle[i].imagen + '" class="img-fluid" alt="quixote">';
      detalle_pedido += '     </a>';
      detalle_pedido += '     </div>';
      detalle_pedido += '</li>';
  }

  // Verifica si hay elementos en el detalle del pedido y añade un espacio adicional si es necesario.
  if (venta.detalle.length > 0) {
      detalle_pedido += '<li class="list-group-item d-flex justify-content-between align-items-start">';
      detalle_pedido += ' <div class="ms-2 me-auto" style="height: 100px !important;">';
      detalle_pedido += '   <div class="fw-bold">&nbsp;</div>';
      detalle_pedido += '</li>';
  }

  // Cierra la lista ordenada.
  detalle_pedido += '</ol>';

  // Actualiza el contenido HTML del elemento con ID 'detalle_pedido' con los detalles del pedido.
  $("#detalle_pedido").html(detalle_pedido);

  // Llama a la función 'total_pedido' para actualizar el total del pedido.
  total_pedido();
}





function mostrar_detalle(categoria, id, variante, precio, minima) {
  // Busca y obtiene el producto específico de la configuración almacenada en localStorage.
  var producto = (JSON.parse(localStorage.getItem('configuracion_pagina')).content.find(word => word.codigo + "" === categoria)).producto.find(prod => prod.codigo + "" === id);

  // Obtiene la información actual de la venta de localStorage y la convierte en un objeto JavaScript.
  var venta = JSON.parse(localStorage.getItem('venta'));

  // Crea una clave única para la variante del producto combinando la variante y el precio.
  var key_variante = variante.replaceAll(" ", "") + "" + precio;

  // Inicializa un objeto 'item' en el objeto 'venta'.
  venta.item = {};

  // Asigna valores al objeto 'item' basados en el producto y los parámetros proporcionados.
  venta.item.nombre = producto.nombre + " ( " + variante + " ) ";
  venta.item.descripcion = producto.descripcion;
  venta.item.codigo = producto.codigo;
  venta.item.idcategoria = categoria;
  venta.item.categoria = producto.categoria;
  venta.item.moneda = (producto.variedad[0].moneda ? producto.variedad[0].moneda : "-");
  venta.item.imagen = producto.imagen;
  venta.item.cantidad = 0;
  venta.item.minima = minima;
  venta.item.key_completo = id + key_variante + "";

  // Intenta obtener la cantidad actual del producto desde la interfaz de usuario.
  try {
      venta.item.cantidad = parseInt($('#id_cantidad_' + id + key_variante).text());
  } catch (e) {
      // En caso de error, no hace nada.
  }

  // Asigna el precio y la variante al objeto 'item'.
  venta.item.precio = precio;
  venta.item.variante = variante;

  // Calcula y asigna el total para el objeto 'item'.
  venta.item.total = parseFloat(parseFloat(venta.item.precio) * parseFloat(venta.item.cantidad)).toFixed(2);

  // Actualiza la información de la venta en localStorage.
  localStorage.setItem('venta', JSON.stringify(venta));

  // Llama a la función 'agregar_pedido' para agregar el item al pedido.
  agregar_pedido();
}






function eliminar_detalle(key_completo) {
  // Obtiene la información actual de la venta de localStorage y la convierte en un objeto JavaScript.
  var venta = JSON.parse(localStorage.getItem('venta'));

  // Inicializa una variable para verificar si el producto existe en el detalle.
  var existe = false;

  // Itera sobre los detalles de la venta.
  for (var i = 0; i < venta.detalle.length; i++) {

      // Verifica si el producto actual coincide con el 'key_completo' proporcionado.
      if (venta.detalle[i].key_completo == key_completo) {
          var codigo_ = venta.detalle[i].codigo;

          // Filtra los productos que tienen el mismo código.
          var temporal_venta_cantidad = venta.detalle.filter(prod => ("" + prod.codigo) == ("" + codigo_));

          // Elimina el producto del detalle de la venta.
          venta.detalle.splice(i, 1);

          // Elimina el elemento de la interfaz de usuario si hay más de un producto con el mismo código.
          if (temporal_venta_cantidad && temporal_venta_cantidad.length > 1) {
              $("#detalle_cantidad_row_" + key_completo).remove();
          } else {
              // Actualiza la interfaz de usuario para productos con un único código.
              $("#detalle_cantidad_" + codigo_).html("");
              $("#detalle_item_" + codigo_).css({ 'background-color': '#F6F8FC' });
          }
          break;
      }
  }

  // Actualiza la información de la venta en localStorage.
  localStorage.setItem('venta', JSON.stringify(venta));

  // Llama a las funciones 'total_pedido' y 'mostrar_pedido' para actualizar la interfaz.
  total_pedido();
  mostrar_pedido();
}





function total_pedido() {
  // Obtiene la información actual de la venta de localStorage y la convierte en un objeto JavaScript.
  var venta = JSON.parse(localStorage.getItem('venta'));

  // Inicializa una variable para almacenar el total del pedido.
  var total = 0.0;

  // Inicializa una variable para almacenar la moneda del pedido.
  var moneda = "";

  // Itera sobre cada producto en el detalle de la venta.
  for (var i = 0; i < venta.detalle.length; i++) {
      // Asigna la moneda del producto actual a la variable 'moneda'.
      moneda = venta.detalle[i].moneda;

      // Suma el total del producto actual al total acumulado del pedido.
      total = parseFloat(parseFloat(total) + parseFloat(venta.detalle[i].total)).toFixed(2);
  }

  // Asigna el total calculado y la moneda al objeto 'venta'.
  venta.total = total;
  venta.moneda = moneda;
  venta.total_venta = total;

  // Actualiza la información de la venta en localStorage.
  localStorage.setItem('venta', JSON.stringify(venta));

  // Actualiza la interfaz de usuario con el total del pedido.
  if (venta.detalle.length > 0) {
      $(".venta_detalle_total").html(venta.moneda + "" + venta.total);
  } else {
      // Si no hay productos en el detalle, muestra un total de 0.
      $(".venta_detalle_total").html("0.00");
  }
}






function agregar_pedido() {
  // Obtiene la información actual de la venta de localStorage y la convierte en un objeto JavaScript.
  var venta = JSON.parse(localStorage.getItem('venta'));

  // Verifica si el total del producto a agregar es 0.
  if (parseFloat(venta.item.total) == 0) {
      // Muestra una advertencia si el total es 0.
      Swal.fire("Warning!", "Agregar cantidad al producto", "warning");
  } else {
      // Filtra los productos en el detalle de la venta que no coinciden con el producto actual.
      var temporal_venta = venta.detalle.filter(prod => ("" + prod.nombre) != ("" + venta.item.nombre));

      // Agrega el producto actual al array filtrado.
      temporal_venta.push(venta.item);

      // Actualiza el detalle de la venta con el nuevo array.
      venta.detalle = temporal_venta;

      // Actualiza la información de la venta en localStorage.
      localStorage.setItem('venta', JSON.stringify(venta));

      // Llama a la función 'total_pedido' para actualizar el total del pedido.
      total_pedido();
  }
}




function inicializarVenta() {
  // Inicializa un objeto 'venta' vacío.
  var venta = {};

  // Inicializa un objeto 'item' vacío dentro de 'venta'.
  venta.item = {};
  venta.item.total = 0.00;
  venta.item.precio = 0.00;
  venta.item.cantidad = 0.00;
  venta.item.talla = "";
  venta.item.color = "";
  venta.item.nombre = "";
  venta.item.descripcion = "";
  venta.item.codigo = "";
  venta.item.categoria = "";
  venta.item.precios = [];

  // Inicializa un array vacío para el detalle de la venta.
  venta.detalle = [];

  // Guarda el objeto 'venta' inicializado en localStorage.
  localStorage.setItem('venta', JSON.stringify(venta));
}




function buscar_productos() {
  // Verifica si el elemento con ID 'filtro_producto' es visible.
  if ($('#filtro_producto').is(':visible')) {
      // Oculta el elemento si está visible.
      $('#filtro_producto').hide();
  } else {
      // Muestra el elemento si está oculto.
      $('#filtro_producto').show();
  }
}







function listar_configuracion(idpedido, operacion) {
  // Inicializa una variable para almacenar el HTML del carrusel.
  var lstCarrusel = '';

  // Muestra un cargador mientras se realiza la operación.
  $(".loader-wrapper").fadeIn("slow", function () {

      // Realiza una petición AJAX.
      $.ajax({
          url: url_final_venta + "exec", // URL a la que se hace la petición.
          jsonp: "callback", // Tipo de respuesta esperada.
          method: 'POST', // Método HTTP utilizado.
          data: JSON.stringify({ op: "configuracion", id: idpedido }), // Datos enviados al servidor.
          async: false, // Establece la petición como síncrona.
          success: function (respuesta) {
              // Función que se ejecuta al recibir una respuesta exitosa.

              // Verifica si el estado de la respuesta es '0' (éxito).
              if (respuesta.status == '0') {
                  // Almacena la configuración en el almacenamiento local.
                  localStorage.setItem('configuracion_pagina', JSON.stringify(respuesta));

                  // Actualiza el título de la página y otros elementos con datos de la respuesta.
                  $("#pagina_titulo").html(respuesta.pagina_nombre);
                  $("#nombre_empresa").text(respuesta.nombre_empresa);
                  document.title = respuesta.nombre_empresa;

                  // Verifica si hay datos para el carrusel y los procesa.
                  if (respuesta.pagina_carrusel != null && respuesta.pagina_carrusel.length > 0) {
                      lstCarrusel += '<div class="carousel-inner">';
                      for (var i = 0; i < respuesta.pagina_carrusel.length; i++) {
                          lstCarrusel += i == 0 ? '<div class="carousel-item active">' : '<div class="carousel-item">';
                          lstCarrusel += '<a href="' + respuesta.pagina_url + '">';
                          lstCarrusel += '<img src="' + respuesta.pagina_carrusel[i] + '" class="d-block w-100" alt="...">';
                          lstCarrusel += '</a></div>';
                      }
                      lstCarrusel += '</div>';
                  }
                  // Actualiza el HTML del carrusel.
                  $("#carouselExampleSlidesOnly").html(lstCarrusel);

                  // Procesa y muestra las opciones de agencia.
                  var lstAgencia = '<option value="" selected>Seleccione</option>';
                  if (respuesta.contentagencia != null && respuesta.contentagencia.length > 0) {
                      for (var i = 0; i < respuesta.contentagencia.length; i++) {
                          lstAgencia += '<option value="' + respuesta.contentagencia[i].codigo + '">' + respuesta.contentagencia[i].descripcion + '</option>';
                      }
                  }
                  $("#txt_agencia").html(lstAgencia);

                  // Carga los productos.
                  cargar_productos("", "");

                  // Si hay un pedido existente y la operación es de edición, carga los detalles del pedido.
                  if (respuesta.pedido && idpedido && operacion == "e") {
                      for (var k = 0; k < respuesta.pedido.detalle.length; k++) {
                          mostrar_cantidad_pedido(respuesta.pedido.detalle[k].idcategoria, respuesta.pedido.detalle[k].codigo, respuesta.pedido.detalle[k].variante, respuesta.pedido.detalle[k].precio, respuesta.pedido.detalle[k].moneda, respuesta.pedido.detalle[k].minima, respuesta.pedido.detalle[k].cantidad);
                      }
                      // Actualiza los campos del formulario con los datos del pedido.
                      $("#txt_nombre").val(respuesta.pedido.nombre_entrega);
                      $("#txt_telefono").val(respuesta.pedido.telefono_entrega);
                      $("#txt_direccion").val(respuesta.pedido.direccion_entrega);
                      $("#txt_agencia").val(respuesta.pedido.agencia_entrega);
                      $("#txt_rut").val(respuesta.pedido.rut_entrega);
                      $("#txt_correo").val(respuesta.pedido.correo_entrega);
                  }
              } else {
                  // Muestra una alerta si hay un error en la respuesta.
                  Swal.fire("Alerta!", respuesta.message, "warning");
              }
          },
          complete: function (data) {
              // Función que se ejecuta al completar la petición, independientemente del resultado.
              console.log("complete:function");
              // Oculta el cargador.
              $(".loader-wrapper").fadeOut("slow");
          }
      });
  });
}








function mostrar_cantidad_pedido(categoria, id, variedad, precio, moneda, minima, cantidad_producto) {
  // Imprime en la consola los parámetros recibidos para depuración.
  console.log(categoria, id, variedad, precio, moneda, minima);

  // Inicializa una variable para construir el HTML de los productos.
  var lstProductos = '';

  // Establece un valor mínimo por defecto si no se proporciona.
  if (!minima) {
      minima = 1;
  }

  // Crea una clave única para la variedad del producto combinando la variedad y el precio.
  var key_variedad = variedad.replaceAll(" ", "") + "" + precio;

  // Obtiene el HTML existente para el producto específico.
  var html_existente = $("#detalle_cantidad_" + id).html();

  // Verifica si ya existe HTML para este producto y lo prepara para actualizar.
  if (!html_existente) {
      lstProductos += '<hr class="my-1" />';
  } else {
      // Elimina la fila existente si ya está presente.
      $("#detalle_cantidad_row_" + id + key_variedad).remove();
      html_existente = $("#detalle_cantidad_" + id).html();
  }

  // Construye el HTML para mostrar la cantidad del producto y los botones para modificarla.
  lstProductos += '<div class="row" id="detalle_cantidad_row_' + id + key_variedad + '">';
  lstProductos += '<span class="plato_descripcion">' + variedad + " " + moneda + "" + precio + '</span>';
  lstProductos += '<div class="btn-toolbar" role="toolbar">';
  lstProductos += '<div class="btn-group" style="margin-right:10px !important;" role="group">';
  lstProductos += '   <button type="button" class="btn btn-secondary btn-sm" onclick="mostrar_cantidad(\'restar\',\'id_cantidad_' + id + key_variedad + '\',\'' + minima + '\');">-</button>';
  lstProductos += '  <button type="button" class="btn btn-light btn-sm" id="id_cantidad_' + id + key_variedad + '">' + cantidad_producto + '</button>';
  lstProductos += '   <button type="button" class="btn btn-secondary btn-sm" onclick="mostrar_cantidad(\'agregar\',\'id_cantidad_' + id + key_variedad + '\',\'' + minima + '\');">+</button>';
  lstProductos += ' </div>';
  lstProductos += ' <div class="btn-group" role="group">';
  lstProductos += '   <button type="button" id="agregar_carrito' + id + key_variedad + '" class="btn btn-dark btn-sm invisible" onclick="mostrar_detalle(\'' + categoria + '\',\'' + id + '\',\'' + variedad + '\',\'' + precio + '\',\'' + minima + '\');"><i class="fa fa-shopping-cart"></i></button>';
  lstProductos += ' </div>';
  lstProductos += '  </div>';
  lstProductos += '  </div>';

  // Actualiza el HTML existente con el nuevo HTML construido.
  if (!html_existente) {
      lstProductos += ' <div id="agregar_opcion"></div>';
  } else {
      html_existente = html_existente.replace("<div id=\"agregar_opcion\"", lstProductos + "<div id=\"agregar_opcion\"");
  }

  // Imprime en la consola el HTML resultante para depuración.
  console.log(html_existente);

  // Actualiza el HTML del elemento correspondiente al producto con el nuevo HTML.
  $("#detalle_cantidad_" + id).html(html_existente);

  // Cambia el color de fondo del elemento del producto.
  $("#detalle_item_" + id).css({ 'background-color': '#EAF1FB' });

  // Simula un clic en el botón de agregar al carrito para el producto específico.
  $("#agregar_carrito" + id + key_variedad).click();
}







function mostrar_popuppedido(categoria, id) {
  // Encuentra el producto específico en la configuración almacenada en localStorage.
  var producto = (JSON.parse(localStorage.getItem('configuracion_pagina')).content.find(word => word.codigo + "" === categoria)).producto.find(prod => prod.codigo + "" === id);

  // Inicia la construcción del HTML para el detalle del producto.
  var detalle = '<div class="btn-group-vertical">';
  detalle += '</div>';

  // Itera sobre cada variedad del producto.
  for (var i = 0; i < producto.variedad.length; i++) {
      // Verifica si la variedad actual no tiene sub-variedades.
      if (!producto.variedad[i].sub_variedad) {
          // Crea un botón para cada variedad sin sub-variedades.
          detalle += '  <button type="button" data-bs-dismiss="modal" onclick="mostrar_cantidad_pedido(\'' + categoria + '\',\'' + id + '\',\'' + producto.variedad[i].variedad + '\',\'' + producto.variedad[i].precio + '\',\'' + producto.variedad[i].moneda + '\',\'' + producto.variedad[i].minima + '\',1);" class="btn btn-dark mb-3">' + producto.variedad[i].variedad + ' ' + producto.variedad[i].moneda + '' + producto.variedad[i].precio + '</button><br/>';
      } else {
          // Crea un botón desplegable para variedades con sub-variedades.
          detalle += '  <button type="button" class="btn btn-dark mb-3 dropdown-toggle" id="dropdownMenuOffset' + id + '_' + i + '" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + producto.variedad[i].variedad + ' ' + producto.variedad[i].moneda + '' + producto.variedad[i].precio + '</button>';
          detalle += ' <div class="dropdown-menu" aria-labelledby="dropdownMenuOffset' + id + '_' + i + '">';

          // Divide las sub-variedades y crea un enlace para cada una.
          var detalle_variedad = producto.variedad[i].sub_variedad.split(",");
          console.log(producto.variedad[i].sub_variedad);
          for (var j = 0; j < detalle_variedad.length; j++) {
              detalle += '<a class="dropdown-item" data-bs-dismiss="modal" href="#" onclick="mostrar_cantidad_pedido(\'' + categoria + '\',\'' + id + '\',\'' + producto.variedad[i].variedad + " - " + detalle_variedad[j] + '\',\'' + producto.variedad[i].precio + '\',\'' + producto.variedad[i].moneda + '\',\'' + producto.variedad[i].minima + '\',1);">' + detalle_variedad[j] + '</a>';
          }
          detalle += '  </div><br/>';
      }
  }

  // Actualiza el contenido HTML del modal con los detalles del producto.
  $("#detalle_modal_producto").html(detalle);

  // Simula un clic en el botón para cargar las variedades.
  $("#btn_cargar_variedad").click();
}






function cargar_productos(tipo, filtro) {
  // Inicializa una variable para construir el HTML de los productos.
  var lstProductos = '';

  // Obtiene la lista de productos desde el almacenamiento local.
  var lst_producto = JSON.parse(localStorage.getItem('configuracion_pagina')).content;

  // Filtra los productos por nombre si el tipo es "Nombre".
  if (tipo == "Nombre") {
      // Imprime en consola el valor del campo de búsqueda para depuración.
      console.log($("#txt_search").val());

      // Inicializa un array temporal para almacenar los productos filtrados.
      var lst_producto_temporal = [];

      // Itera sobre cada categoría de productos.
      for (var i = 0; i < lst_producto.length; i++) {
          var temporal_categoria = lst_producto[i];

          // Filtra los productos de la categoría que coinciden con el texto de búsqueda.
          var temporal_producto = temporal_categoria.producto.filter(prod => (prod.nombre).toUpperCase().includes(($("#txt_search").val()).toUpperCase()));

          // Si hay productos coincidentes, los añade al array temporal.
          if (temporal_producto != null && temporal_producto.length > 0) {
              temporal_categoria.producto = temporal_producto;
              lst_producto_temporal.push(temporal_categoria);
          }
      };

      // Actualiza la lista de productos con los productos filtrados.
      lst_producto = lst_producto_temporal;
  }

  // Itera sobre cada categoría de productos para construir el HTML.
  for (var i = 0; i < lst_producto.length; i++) {
      // Añade el encabezado de la categoría.
      lstProductos += '<div class="accordion-item">';
      lstProductos += '   <h2 class="accordion-header" id="flush-heading-' + lst_producto[i].codigo + '">';
      lstProductos += '     <button class="accordion-button collapsed text-center desplegar_acordeon" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapse-' + lst_producto[i].codigo + '" aria-expanded="false" aria-controls="flush-collapse-' + lst_producto[i].codigo + '">';
      lstProductos += '     <div>';
      lstProductos += '     <span class="categoria_nombre">' + lst_producto[i].nombre + '</span> ';
      lstProductos += '     </div>';
      lstProductos += '   </button>';
      lstProductos += '   </h2>';

      // Añade los productos de la categoría.
      lstProductos += '   <div id="flush-collapse-' + lst_producto[i].codigo + '" class="accordion-collapse collapse show" aria-labelledby="flush-heading-' + lst_producto[i].codigo + '" data-bs-parent="#accordionFlushExample">';
      lstProductos += '     <div class="accordion-body">';
      lstProductos += '     <ol class="list-group">';

      // Verifica si hay productos en la categoría.
      if (lst_producto[i].producto != null && lst_producto[i].producto.length > 0) {
          // Itera sobre cada producto.
          for (var j = 0; j < lst_producto[i].producto.length; j++) {
              // Añade cada producto con su nombre, descripción, precio y una imagen.
              lstProductos += '     <li class="list-group-item d-flex justify-content-between align-items-center"  id="detalle_item_' + lst_producto[i].producto[j].codigo + '">';
              lstProductos += '     <div>';
              lstProductos += '    <div  onclick="mostrar_popuppedido(\'' + lst_producto[i].codigo + '\',\'' + lst_producto[i].producto[j].codigo + '\');"> <span class="plato_nombre">' + lst_producto[i].producto[j].nombre + '</span> ';
              lstProductos += '     <span class="plato_descripcion">' + lst_producto[i].producto[j].descripcion + '</span> ';
              lstProductos += '     <span class="plato_monto">Desde ' + lst_producto[i].producto[j].variedad[0].moneda + "" + lst_producto[i].producto[j].variedad[0].precio + '</span> </div>';

              // Añade un contenedor para la cantidad del producto.
              lstProductos += '<div id="detalle_cantidad_' + lst_producto[i].producto[j].codigo + '"></div>';
              lstProductos += '     </div>';
              lstProductos += '     <div class="image-parent">';
              lstProductos += ' <a href="' + lst_producto[i].producto[j].imagen + '" data-fancybox data-caption="' + lst_producto[i].producto[j].nombre + '">';
              lstProductos += '     <img src="' + lst_producto[i].producto[j].imagen + '" class="img-fluid" alt="quixote">';
              lstProductos += '     </a>';
              lstProductos += '     </div>';
              lstProductos += '     </li>';
          }
      }
      lstProductos += '     </ol>';
      lstProductos += '     </div>';
      lstProductos += '   </div>';
      lstProductos += ' </div>';
  }

  // Actualiza el contenido HTML del contenedor de acordeón con los productos.
  $("#accordionFlushExample").html(lstProductos);

  // Si se ha realizado una búsqueda por nombre y hay productos, despliega el acordeón.
  if (tipo == "Nombre" && lst_producto.length > 0 && $("#txt_search").val()) {
      $(".desplegar_acordeon").click();
  }
}
