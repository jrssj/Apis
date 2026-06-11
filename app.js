const URL_API = "https://dragonball-api.com/api";

// ── Variables globales ──
let paginaActualPersonajes = 1;
let razaActual = "";
let todosPlanetas = [];
let filtroEstadoPlaneta = "todos";
let paginaActualPlanetas = 1;
let todasTransformaciones = [];
let paginaActualTrans = 1;
let busquedaTrans = "";

// ── INICIO DE SESIÓN ──

async function entrarApp() {
  var clave = document.getElementById("campo-clave").value.trim();
  var errorEl = document.getElementById("error-inicio");

  if (!clave) {
    alert("Por favor escribe algo para continuar.");
    return;
  }

  errorEl.style.display = "none";

  try {
    var respuesta = await fetch(URL_API + "/characters?limit=1");
    if (!respuesta.ok) throw new Error("Sin conexión");
  } catch (e) {
    errorEl.textContent = "No se pudo conectar con la API.";
    errorEl.style.display = "block";
    return;
  }

  sessionStorage.setItem("clave_sesion", clave);
  document.getElementById("pantalla-inicio").style.display = "none";
  document.getElementById("app-principal").style.display = "block";
  cargarPersonajes(1);
}

function cerrarSesion() {
  sessionStorage.removeItem("clave_sesion");
  document.getElementById("pantalla-inicio").style.display = "flex";
  document.getElementById("app-principal").style.display = "none";
  document.getElementById("campo-clave").value = "";
}

window.addEventListener("DOMContentLoaded", function () {
  var claveSesion = sessionStorage.getItem("clave_sesion");
  if (claveSesion) {
    document.getElementById("campo-clave").value = claveSesion;
    entrarApp();
  }

  document.getElementById("campo-busqueda").addEventListener("keydown", function (e) {
    if (e.key === "Enter") buscarPersonaje();
  });

  document.getElementById("campo-busqueda-trans").addEventListener("keydown", function (e) {
    if (e.key === "Enter") buscarTransformacion();
  });
});

// ── PETICIÓN A LA API ──

async function pedirDatos(ruta) {
  try {
    var respuesta = await fetch(URL_API + ruta);
    if (!respuesta.ok) throw new Error("Error en la respuesta");
    var datos = await respuesta.json();
    return datos;
  } catch (error) {
    console.error("Error al pedir datos:", error);
    return null;
  }
}

// ── CAMBIO DE SECCIONES ──

var seccionesCargadas = {};

function mostrarSeccion(nombre, boton) {
  // Ocultar todas las secciones
  var secciones = document.querySelectorAll(".seccion");
  for (var i = 0; i < secciones.length; i++) {
    secciones[i].classList.remove("activa");
  }

  // Desmarcar todas las pestañas del menú
  var pestanas = document.querySelectorAll(".menu-pestanas .pestana");
  for (var j = 0; j < pestanas.length; j++) {
    pestanas[j].classList.remove("activa");
  }

  // Mostrar la sección seleccionada
  document.getElementById("seccion-" + nombre).classList.add("activa");
  boton.classList.add("activa");

  // Cargar datos si es la primera vez
  if (!seccionesCargadas[nombre]) {
    seccionesCargadas[nombre] = true;
    if (nombre === "planetas") cargarPlanetas();
    if (nombre === "transformaciones") cargarTransformaciones();
  }
}

// ── TARJETA GENÉRICA ──

function crearTarjeta(imagen, nombre, subtitulo, detalle, idPersonaje) {
  var clickeable = idPersonaje ? 'clickeable" onclick="abrirPersonaje(' + idPersonaje + ')' : "";
  return '<div class="tarjeta ' + clickeable + '">' +
    '<img class="imagen-tarjeta" src="' + imagen + '" onerror="this.src=\'https://placehold.co/70x70?text=DB\'" />' +
    '<div class="info-tarjeta">' +
      '<div class="nombre-tarjeta">' + nombre + '</div>' +
      '<div class="subtitulo-tarjeta">' + subtitulo + '</div>' +
      '<div class="detalle-tarjeta">' + detalle + '</div>' +
    '</div>' +
  '</div>';
}

// ── PERSONAJES ──

async function cargarPersonajes(pagina) {
  paginaActualPersonajes = pagina;
  var lista = document.getElementById("lista-personajes");
  lista.innerHTML = '<div class="cargando"><div class="rueda"></div>Cargando personajes...</div>';

  var url = "/characters?page=" + pagina + "&limit=10";
  if (razaActual) url += "&race=" + encodeURIComponent(razaActual);

  var datos = await pedirDatos(url);
  if (!datos) {
    lista.innerHTML = '<div class="vacio"><div class="icono-vacio">⚠️</div>Error al cargar.</div>';
    return;
  }

  var personajes = datos.items || [];
  var meta = datos.meta || {};

  document.getElementById("contador-personajes").textContent = (meta.totalItems || personajes.length) + " guerreros";

  if (personajes.length === 0) {
    lista.innerHTML = '<div class="vacio"><div class="icono-vacio">😔</div>No hay personajes en esta categoría.</div>';
    document.getElementById("paginacion-personajes").innerHTML = "";
    return;
  }

  var html = "";
  for (var i = 0; i < personajes.length; i++) {
    var p = personajes[i];
    html += crearTarjeta(
      p.image,
      p.name,
      p.race + " · " + p.affiliation,
      "Ki: " + p.ki + " | Ki Máximo: " + p.maxKi,
      p.id
    );
  }
  lista.innerHTML = html;

  crearPaginacion("paginacion-personajes", paginaActualPersonajes, meta.totalPages || 1, cargarPersonajes);
}

function filtrarPorRaza(raza, boton) {
  var botones = document.querySelectorAll("#filtros-raza .pestana");
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.remove("activa");
  }
  boton.classList.add("activa");
  razaActual = raza;
  cargarPersonajes(1);
}

async function buscarPersonaje() {
  var termino = document.getElementById("campo-busqueda").value.trim();
  var lista = document.getElementById("lista-personajes");

  if (!termino) {
    cargarPersonajes(1);
    return;
  }

  lista.innerHTML = '<div class="cargando"><div class="rueda"></div>Buscando...</div>';
  document.getElementById("paginacion-personajes").innerHTML = "";

  var datos = await pedirDatos("/characters?name=" + encodeURIComponent(termino));
  var resultados = Array.isArray(datos) ? datos : (datos ? [datos] : []);

  if (resultados.length === 0) {
    lista.innerHTML = '<div class="vacio"><div class="icono-vacio">🔍</div>No se encontró "' + termino + '".</div>';
    document.getElementById("contador-personajes").textContent = "0 resultados";
    return;
  }

  document.getElementById("contador-personajes").textContent = resultados.length + " resultado(s)";

  var html = "";
  for (var i = 0; i < resultados.length; i++) {
    var p = resultados[i];
    html += crearTarjeta(p.image, p.name, p.race + " · " + p.affiliation, "Ki Máximo: " + p.maxKi, p.id);
  }
  lista.innerHTML = html;
}

function limpiarBusqueda() {
  document.getElementById("campo-busqueda").value = "";
  razaActual = "";

  var botones = document.querySelectorAll("#filtros-raza .pestana");
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.remove("activa");
  }
  botones[0].classList.add("activa");

  cargarPersonajes(1);
}

// ── MODAL PERSONAJE ──

async function abrirPersonaje(id) {
  var modal = document.getElementById("modal-personaje");
  var contenido = document.getElementById("contenido-modal");

  contenido.innerHTML = '<div class="cargando"><div class="rueda"></div>Cargando datos...</div>';
  modal.style.display = "flex";

  var personaje = await pedirDatos("/characters/" + id);
  if (!personaje) {
    contenido.innerHTML = '<p style="color:var(--rojo)">Error al cargar el personaje.</p>';
    return;
  }

  var planeta = personaje.originPlanet ? personaje.originPlanet.name : "Desconocido";

  contenido.innerHTML =
    '<button class="boton-cerrar-modal" onclick="cerrarModal()">✕</button>' +
    '<div class="modal-fila-superior">' +
      '<img class="modal-imagen" src="' + personaje.image + '" onerror="this.src=\'https://placehold.co/150x220?text=DB\'" />' +
      '<div style="flex:1; min-width:200px;">' +
        '<h2 class="modal-nombre">' + personaje.name + '</h2>' +
        '<p class="modal-raza">' + personaje.race + ' · ' + personaje.gender + ' · ' + personaje.affiliation + '</p>' +
        '<div class="modal-stats">' +
          '<div>Ki Base: <span>' + personaje.ki + '</span></div>' +
          '<div>Ki Máximo: <span>' + personaje.maxKi + '</span></div>' +
          '<div>Planeta de origen: <span style="color:var(--azul)">' + planeta + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<p class="modal-descripcion">' + (personaje.description || "Sin descripción disponible.") + '</p>';
}

function cerrarModal(evento) {
  var modal = document.getElementById("modal-personaje");
  if (!evento || evento.target === modal) {
    modal.style.display = "none";
  }
}

// ── PLANETAS ──

async function cargarPlanetas() {
  var lista = document.getElementById("lista-planetas");
  lista.innerHTML = '<div class="cargando"><div class="rueda"></div>Cargando planetas...</div>';

  // Cargamos varias páginas para poder filtrar
  todosPlanetas = [];
  var pagina = 1;
  var totalPaginas = 1;

  while (pagina <= totalPaginas && pagina <= 5) {
    var datos = await pedirDatos("/planets?page=" + pagina + "&limit=50");
    if (!datos) break;
    var items = datos.items || [];
    for (var i = 0; i < items.length; i++) {
      todosPlanetas.push(items[i]);
    }
    totalPaginas = datos.meta ? datos.meta.totalPages : 1;
    pagina++;
  }

  mostrarPlanetas();
}

function filtrarPlanetas(estado, boton) {
  var botones = document.querySelectorAll("#filtros-planetas .pestana");
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.remove("activa");
  }
  boton.classList.add("activa");
  filtroEstadoPlaneta = estado;
  paginaActualPlanetas = 1;
  mostrarPlanetas();
}

function mostrarPlanetas() {
  var lista = document.getElementById("lista-planetas");
  var porPagina = 10;

  var filtrados = todosPlanetas;
  if (filtroEstadoPlaneta === "vivos") {
    filtrados = todosPlanetas.filter(function (p) { return !p.isDestroyed; });
  }
  if (filtroEstadoPlaneta === "destruidos") {
    filtrados = todosPlanetas.filter(function (p) { return p.isDestroyed; });
  }

  document.getElementById("contador-planetas").textContent = filtrados.length + " planetas";

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="vacio"><div class="icono-vacio">🪐</div>No hay planetas en esta categoría.</div>';
    document.getElementById("paginacion-planetas").innerHTML = "";
    return;
  }

  var totalPaginas = Math.ceil(filtrados.length / porPagina);
  if (paginaActualPlanetas > totalPaginas) paginaActualPlanetas = 1;

  var inicio = (paginaActualPlanetas - 1) * porPagina;
  var corte = filtrados.slice(inicio, inicio + porPagina);

  var html = "";
  for (var i = 0; i < corte.length; i++) {
    var planeta = corte[i];
    var estado = planeta.isDestroyed ? "💥 Destruido" : "🌍 Habitable";
    var descripcion = planeta.description ? planeta.description.slice(0, 100) + "…" : "Sin descripción.";
    html += crearTarjeta(planeta.image, planeta.name, estado, descripcion, null);
  }
  lista.innerHTML = html;

  crearPaginacion("paginacion-planetas", paginaActualPlanetas, totalPaginas, function (p) {
    paginaActualPlanetas = p;
    mostrarPlanetas();
  });
}

// ── TRANSFORMACIONES ──

async function cargarTransformaciones() {
  var lista = document.getElementById("lista-transformaciones");
  lista.innerHTML = '<div class="cargando"><div class="rueda"></div>Cargando transformaciones...</div>';

  todasTransformaciones = [];
  var pagina = 1;
  var totalPaginas = 1;

  while (pagina <= totalPaginas && pagina <= 10) {
    var datos = await pedirDatos("/transformations?page=" + pagina + "&limit=50");
    if (!datos) break;
    var items = Array.isArray(datos) ? datos : (datos.items || []);
    for (var i = 0; i < items.length; i++) {
      todasTransformaciones.push(items[i]);
    }
    var meta = datos.meta || {};
    totalPaginas = meta.totalPages || 1;
    pagina++;
  }

  mostrarTransformaciones();
}

function buscarTransformacion() {
  busquedaTrans = document.getElementById("campo-busqueda-trans").value.trim().toLowerCase();
  paginaActualTrans = 1;
  mostrarTransformaciones();
}

function limpiarBusquedaTrans() {
  document.getElementById("campo-busqueda-trans").value = "";
  busquedaTrans = "";
  paginaActualTrans = 1;
  mostrarTransformaciones();
}

function mostrarTransformaciones() {
  var lista = document.getElementById("lista-transformaciones");
  var porPagina = 12;

  var filtradas = todasTransformaciones;
  if (busquedaTrans) {
    filtradas = todasTransformaciones.filter(function (t) {
      return t.name && t.name.toLowerCase().includes(busquedaTrans);
    });
  }

  document.getElementById("contador-transformaciones").textContent = filtradas.length + " transformaciones";

  if (filtradas.length === 0) {
    lista.innerHTML = '<div class="vacio"><div class="icono-vacio">🔍</div>No se encontraron transformaciones.</div>';
    document.getElementById("paginacion-transformaciones").innerHTML = "";
    return;
  }

  var totalPaginas = Math.ceil(filtradas.length / porPagina);
  if (paginaActualTrans > totalPaginas) paginaActualTrans = 1;

  var inicio = (paginaActualTrans - 1) * porPagina;
  var corte = filtradas.slice(inicio, inicio + porPagina);

  var html = "";
  for (var i = 0; i < corte.length; i++) {
    var t = corte[i];
    html += crearTarjeta(t.image, t.name, "Ki: " + (t.ki || "?"), "Transformación de guerrero", null);
  }
  lista.innerHTML = html;

  crearPaginacion("paginacion-transformaciones", paginaActualTrans, totalPaginas, function (p) {
    paginaActualTrans = p;
    mostrarTransformaciones();
  });
}

// ── PAGINACIÓN ──

function crearPaginacion(idContenedor, paginaActual, totalPaginas, funcionCambio) {
  var contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;
  if (totalPaginas <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  var html = "";

  // Botón anterior
  if (paginaActual > 1) {
    html += '<button class="boton-secundario" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="(' + funcionCambio + ')(' + (paginaActual - 1) + ')">← Anterior</button>';
  } else {
    html += '<button class="boton-secundario" style="padding:0.4rem 0.8rem; font-size:0.8rem; opacity:0.4;" disabled>← Anterior</button>';
  }

  // Números de página
  var inicio = Math.max(1, paginaActual - 2);
  var fin = Math.min(totalPaginas, paginaActual + 2);
  for (var p = inicio; p <= fin; p++) {
    var estilo = p === paginaActual ? "activa" : "";
    html += '<button class="pestana ' + estilo + '" onclick="(' + funcionCambio + ')(' + p + ')">' + p + '</button>';
  }

  // Info total
  html += '<span style="font-size:0.78rem; color:var(--texto-suave);">/ ' + totalPaginas + '</span>';

  // Botón siguiente
  if (paginaActual < totalPaginas) {
    html += '<button class="boton-secundario" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="(' + funcionCambio + ')(' + (paginaActual + 1) + ')">Siguiente →</button>';
  } else {
    html += '<button class="boton-secundario" style="padding:0.4rem 0.8rem; font-size:0.8rem; opacity:0.4;" disabled>Siguiente →</button>';
  }

  contenedor.innerHTML = html;
}
