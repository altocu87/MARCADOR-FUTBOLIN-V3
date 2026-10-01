# CONTEXTO MAESTRO DEL PROYECTO
# MARCADOR FUTBOLÍN V3

Contexto proporcionado por el propietario y guardado el **2026-10-01**. Se conservan sus 84 apartados y decisiones; la presentación se organiza en Markdown para facilitar la lectura.

**Leer completamente este documento antes de modificar código.** Leer también [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md), que distingue trabajo publicado, trabajo local, verificación y bloqueos. Las instrucciones de mantenimiento están en [AGENTS.md](../AGENTS.md).

Este texto contiene las decisiones funcionales, técnicas, visuales y de arquitectura ya tomadas para el proyecto.

No interpretar que todo lo descrito debe implementarse inmediatamente. Algunas funciones son actuales y otras pertenecen a fases futuras.

El trabajo debe preservar lo que ya funciona, respetar estas decisiones, desarrollar por fases, evitar reescrituras innecesarias y mantener una arquitectura preparada para el hardware final.

Nota de vigencia: los apartados 56–58 son una referencia histórica de V1. Los apartados 69–70 y 84 describen el bloque de persistencia, no una orden de volver a empezar. El apartado 79 corresponde al trabajo en nube y no implica que cualquier agente esté ejecutándose allí. El estado operativo y las verificaciones posteriores se registran en ESTADO_ACTUAL.md; no se debe confundir una propuesta con una función implementada.

## 1. OBJETIVO GENERAL

MARCADOR FUTBOLÍN V3 es un marcador inteligente para una mesa de futbolín real.

Se está desarrollando primero como aplicación web completa y simulador funcional. Posteriormente se adaptará al hardware ESP32.

La aplicación final deberá gestionar:

- partidos;
- marcador;
- jugadores;
- estadísticas;
- historial;
- ranking;
- XP;
- niveles;
- ELO;
- categorías;
- forma reciente;
- logros;
- récords;
- torneos;
- sonidos;
- efectos visuales;
- botones físicos;
- sensores de gol;
- configuración;
- actualizaciones OTA;
- funcionamiento local/offline;
- posible sincronización online.

PRINCIPIO GENERAL:

Durante un partido: máxima simplicidad.

Fuera del partido: puede existir mucha información, estadísticas y configuración.

Los jugadores utilizan la pantalla DE PIE y CON EL DEDO mientras juegan.

Por tanto:

- botones grandes;
- números enormes;
- pocos controles durante el partido;
- textos legibles;
- nada que requiera precisión con el dedo.

## 2. REPOSITORIO

GitHub: https://github.com/altocu87/MARCADOR-FUTBOLIN-V3

Rama principal: main.

El primer commit funcional conocido fue: b10b1df — Initial functional match simulator.

Antes de empezar cualquier bloque:

1. sincronizar repositorio;
2. revisar el código REAL actual;
3. no asumir que este documento describe exactamente el último commit;
4. preservar cambios posteriores que ya existan.

Nunca incluir en Git:

- .env;
- claves privadas;
- service_role;
- credenciales;
- node_modules;
- dist;
- archivos temporales.

## 3. STACK ACTUAL

La aplicación web utiliza React, Vite, TypeScript y CSS.

No migrar a Next.js ni sustituir el stack salvo orden explícita.

Mantener una arquitectura modular. No convertir el proyecto en un archivo gigante.

## 4. RESOLUCIÓN Y CANVAS

La referencia física MAESTRA sigue siendo **800 × 480 píxeles**, la resolución de la pantalla final.

**Decisión posterior aprobada el 2026-10-01:** adaptar el menú y toda la aplicación web a móvil, tablet y escritorio. Reemplaza la restricción anterior de usar siempre un único lienzo fijo en la web, pero NO cambia la referencia de hardware ni las reglas del partido.

Dos vistas, un mismo motor y datos:

- WEB ADAPTABLE: predeterminada, layout fluido según ancho, altura y orientación. En móvil reorganiza tarjetas, reloj, controles y formularios; no reduce toda la interfaz mediante transform. En monitores grandes, área útil centrada con límites de 1600×1000 para conservar legibilidad.
- PANTALLA 800×480: referencia física exacta, centrada a tamaño real en ventanas mayores, escalada proporcionalmente si no cabe. Sigue siendo necesario verificar todos los flujos a 800×480.
- Selector en AJUSTES → GENERAL → VISTA DE PANTALLA. Preferencia local versionada, sin credenciales ni sincronización remota.
- Cambiar vista, tamaño u orientación no reinicia el partido ni reemplaza el MatchEngine.

REGLAS:

- no scroll general de página;
- no depender de CSS aspect-ratio para solucionar el layout;
- mantener una vista física realmente diseñada dentro de 800×480;
- en la vista web, reorganizar el contenido para mantener controles legibles/táctiles;
- en la vista física, centrar el canvas y escalarlo proporcionalmente solo si no cabe;
- no cortar controles;
- mantener áreas táctiles grandes.

Los paneles internos pueden tener desplazamiento si es estrictamente necesario, pero nunca convertir la interfaz completa en una web vertical convencional.

En alturas extremadamente pequeñas, los controles del partido pueden requerir scroll interno: es preferible a recortarlos o hacerlos diminutos. Considerar áreas seguras y viewport visible; no contrarrestar el zoom del usuario. Las pruebas emuladas no sustituyen la comprobación en dispositivos reales.

## 5. ESTILO VISUAL

Estética:

- moderna;
- futurista;
- oscura;
- deportiva;
- arcade;
- tecnológica;
- neón;
- alto contraste.

Elementos:

- fondos muy oscuros;
- bordes luminosos;
- tarjetas modernas;
- tipografía muy legible;
- números enormes;
- controles táctiles claros.

No usar el antiguo título: "Futbolín Smart Score".

Nombre actual: MARCADOR FUTBOLÍN V3.

## 6. MENÚ PRINCIPAL

Menú principal previsto:

- NUEVO PARTIDO;
- TORNEO;
- RANKING;
- AJUSTES.

Indicador pequeño: ● SISTEMA ONLINE, con punto verde cuando corresponda.

Torneo puede permanecer provisional hasta su fase específica.

La vista web incorpora marca, iconos decorativos y navegación compacta para móvil/poca altura; conserva las cuatro opciones y sus acciones. La vista física conserva el menú original.

## 7. MODOS DE PARTIDO

Existen tres modos principales:

1. PARTIDO RÁPIDO;
2. PARTIDO CAOS;
3. PARTIDO CLASIFICATORIO.

Visualmente deben acabar teniendo personalidad propia. No deben parecer simplemente tres botones idénticos.

Idealmente:

- tarjeta propia;
- imagen/fondo propio;
- color/acento propio;
- descripción breve.

## 8. CONFIGURACIÓN DE VICTORIA

Antes de jugar se puede elegir POR GOLES, POR TIEMPO o AMBAS.

Si se elige AMBAS: el periodo termina cuando ocurra PRIMERO una de las condiciones.

Ejemplo: 5 goles O 5 minutos.

El tiempo configurado corresponde a cada parte/periodo. Los controles para cambiar valores deben ser grandes y táctiles.

## 9. ESTRUCTURA DEL PARTIDO

Flujo normal: 1ª PARTE → 2ª PARTE → FINAL.

Si hay empate: PRÓRROGA.

Duración prevista: 1 minuto. La prórroga utiliza GOL DE ORO. El primer gol gana inmediatamente.

Si termina la prórroga sin gol: PENALTIS.

## 10. CUENTA ATRÁS

Antes del inicio del partido, de la segunda parte y de la prórroga, mostrar 3, 2, 1 a pantalla completa.

Estética: número digital/segmentado enorme.

Debe poder saltarse mediante:

- toque en pantalla;
- botón físico blanco;
- botón físico azul;

cuando exista hardware.

## 11. PANTALLA DE PARTIDO

Equipo: BLANCO = izquierda; AZUL = derecha.

La puntuación debe dominar visualmente la pantalla. Objetivo aproximado: los números ocupan alrededor del 70% del espacio libre disponible.

Centro: reloj digital.

Estilo reloj: digital clásico / segmentos / inspiración Casio.

Mostrar también discretamente modo y parte/periodo.

## 12. CONTROLES DEL MARCADOR

NO debe existir un botón +1 separado grande. El propio número del marcador es el botón de gol.

Tocar número BLANCO → gol blanco. Tocar número AZUL → gol azul.

Debe existir:

- pequeño -1 rojo para Blanco;
- pequeño -1 rojo para Azul;
- DESHACER;
- PAUSA / CONTINUAR.

El objetivo es reducir controles durante el partido.

## 13. REGLA FUNDAMENTAL DE GOLES

NO se pregunta qué jugador marcó. El sistema únicamente registra GOL BLANCO o GOL AZUL.

Esto es deliberado. No introducir posteriormente una selección obligatoria del goleador salvo que el usuario cambie explícitamente esta decisión.

Ejemplo de evento: Gol Blanco · 02:34 · 3-2.

## 14. BLOQUEO DE GOL — CRÍTICO

Después de cada gol se activa un bloqueo de 3 segundos.

Durante esos 3 segundos NINGUNA fuente de entrada puede registrar otro gol.

Debe bloquear:

- pantalla táctil;
- botones físicos;
- ESP32-C3;
- sensores automáticos futuros.

Esta regla pertenece al MATCH ENGINE. NO debe depender únicamente de deshabilitar botones visualmente.

Todas las fuentes de gol deben acabar pasando por la misma validación central.

Implementación revisada el 2026-10-01: el plazo del gol aceptado se conserva al deshacer, corregir, pausar/continuar y cambiar de parte/prórroga, aunque se salte la cuenta atrás. No hay excepción de desbloqueo por esas acciones. Una nueva partida reinicia su propio estado. Ver la evidencia y el estado de publicación en ESTADO_ACTUAL.md.

## 15. EFECTOS DE GOL

Actualmente se definieron/implementaron al menos:

- flash;
- explosión;
- ondas;
- partículas;
- líneas de velocidad.

Objetivo futuro: aproximadamente 10–15 efectos.

Ideas futuras:

- impacto;
- pulso neón;
- burst;
- holograma;
- electricidad;
- fuego;
- confeti;
- trofeo;
- supergol.

También habrá posteriormente efectos de GOL ANULADO. No es prioritario ahora.

## 16. SONIDO

Futuro:

- sonido de gol;
- silbato final primera parte;
- silbato final partido;
- sonidos de interfaz;
- efectos especiales.

No acoplar sonido al MatchEngine de manera que dificulte pruebas.

## 17. FINAL DE PRIMERA PARTE

Mostrar pantalla FINAL DE LA 1ª PARTE con resultado.

Botón: CONTINUAR 2ª PARTE.

Después: cuenta atrás 3-2-1.

## 18. FINAL DEL PARTIDO

Mostrar FINAL DEL PARTIDO, resultado y ganador.

Si empate: activar flujo de prórroga. Si continúa empate: penaltis.

## 19. PENALTIS

Sistema previsto:

- intentos alternos;
- Blanco/Azul;
- 5 intentos iniciales por equipo;
- si continúa empate → muerte súbita.

Interfaz sencilla, grande y futurista. No sobrecargarla.

## 20. JUGADORES

El sistema debe permitir jugadores persistentes.

Datos visuales previstos:

- foto;
- nombre;
- nivel;
- categoría.

Selección previa al partido mediante tarjetas. Máximo: 4 jugadores. Permite 1v1 y 2v2.

Durante el partido: tarjetas pequeñas redondeadas de jugadores.

Pero EL MARCADOR SIEMPRE TIENE PRIORIDAD VISUAL.

## 21. RESUMEN FINAL

Todos los tipos de partido deben terminar con resumen.

Mostrar como mínimo:

- resultado final;
- goles Blanco;
- goles Azul;
- ganador;
- cronología de goles;
- minutos/momentos;
- evolución del resultado.

En clasificatorio, posteriormente:

- variación ELO;
- XP;
- nivel;
- categoría;
- logros;
- récords.

## 22. PRINCIPIO DE ESTADÍSTICAS

El propietario quiere MUCHAS estadísticas. Pero NO deben aumentar la carga mental mientras se juega.

Regla: PARTIDO EN DIRECTO → información mínima. MENÚS / FINAL / PERFIL → información rica.

## 23. HISTORIAL

Cada partido debe almacenar suficiente información para poder reconstruirse.

Datos conceptuales:

- fecha/hora;
- tipo;
- jugadores;
- equipos;
- configuración;
- resultado final;
- resultado por periodos;
- eventos;
- goles;
- minuto/tiempo de goles;
- prórroga;
- penaltis;
- ganador;
- información necesaria para estadísticas;
- información necesaria para XP/ELO.

Futuro:

- ver partido;
- editar;
- eliminar;
- añadir manualmente.

Si se modifica un partido clasificatorio, debe poder recalcularse posteriormente:

- ELO;
- XP;
- niveles;
- estadísticas;
- rachas;
- logros;
- récords.

Por ello NO guardar únicamente el resultado final. Guardar eventos/datos suficientes.

## 24. MODO PRUEBA

AJUSTES debe incluir MODO PRUEBA ON/OFF.

Cuando está ON, la aplicación funciona normalmente. PERO NO GUARDA:

- partidos;
- historial;
- XP;
- ELO;
- niveles;
- estadísticas persistentes;
- logros;
- récords.

Esto permite hacer pruebas sin contaminar datos reales.

## 25. PERFILES

Decisión posterior del propietario, 2026-10-01: autoriza desarrollar en su totalidad el bloque de estadísticas básicas propuesto, con datos simulados mientras queda pendiente la comprobación real de fase B. Perfil básico e historial filtrado implementados: partidos, victorias, derrotas, empates, porcentaje y goles de su equipo a favor/en contra/diferencia. No es autorización de XP/ELO/niveles calculados, logros ni estadísticas avanzadas. El resto de este apartado sigue siendo hoja de ruta futura.

Autorización posterior del mismo día: ampliar el análisis del perfil con últimos cinco resultados, racha actual/mejor racha de victorias, rendimiento 1v1/2v2, filtros inclusivos de fechas/modalidad/formato y evolución acumulada de victorias. Todas las secciones e historial del perfil usan el mismo conjunto. Empates interrumpen victorias/derrotas; penaltis deciden resultado sin sumar goles. Datos en memoria, sin nuevos contadores/tablas ni escritura; no habilita XP/ELO, logros, predicción o forma competitiva. Evidencia y límites en VERIFICACION_ESTADISTICAS.md.

Perfil futuro de jugador:

- foto;
- nombre;
- nivel;
- categoría;
- ELO actual;
- máximo ELO histórico;
- partidos;
- victorias;
- derrotas;
- empates;
- porcentaje victorias;
- goles a favor;
- goles en contra;
- diferencia;
- racha actual;
- mejor racha;
- logros.

Pestañas previstas: GENERAL, CLASIFICATORIO, TORNEOS, RIVALES.

También:

- historial;
- head-to-head;
- rival favorito;
- némesis.

Rival favorito/némesis: solo mostrar conclusión si existen al menos 5 enfrentamientos. Con menos: "Datos insuficientes".

## 26. ELO

NO necesariamente implementar ahora.

Concepto aprobado: ELO inicial = 1200.

Expectativa: E = 1 / (1 + 10 ^ ((Rival - Propio) / 400)).

Actualización: Nuevo ELO = ELO actual + K × (Resultado - Expectativa).

Resultado: victoria = 1; empate = 0.5; derrota = 0.

K aproximado: primeras 10 clasificatorias = 40; jugador establecido = 20.

Estos parámetros deben poder ajustarse posteriormente.

## 27. ELO EN 2v2

ELO del equipo: media del ELO de los jugadores.

El cambio se calcula contra el ELO medio rival. Cada jugador recibe posteriormente su ajuste correspondiente.

Guardar ELO actual y máximo histórico.

## 28. DIFERENCIA DE GOLES Y ELO

Existe una propuesta NO definitiva para pequeño multiplicador:

- 1 gol → 1.00;
- 2 → 1.05;
- 3 → 1.10;
- 4 → 1.15;
- 5+ → 1.20.

No convertirlo en regla irreversible. Debe ser configurable si se implementa.

## 29. CATEGORÍAS

Propuesta actual:

- BRONCE: 0–999;
- PLATA: 1000–1199;
- ORO: 1200–1399;
- PLATINO: 1400–1599;
- DIAMANTE: 1600–1799;
- ÉLITE: 1800+.

Posible mejora futura: histéresis para evitar subir/bajar constantemente.

Ejemplo: ORO entra a 1200, pero no baja hasta <1175.

## 30. XP

XP y ELO son conceptos DIFERENTES.

XP: experiencia acumulativa. ELO: rendimiento competitivo.

Propuesta XP V1:

- completar partido: +50;
- victoria: +100;
- empate: +60;
- derrota: +25;
- victoria clasificatoria: +50 adicional;
- victoria prórroga: +25;
- victoria penaltis: +25;
- ganar torneo: +300;
- récord personal: +50;
- logros: +25 / +50 / +100 según rareza.

Rápido y Caos dan XP. Solo Clasificatorio modifica ELO. Torneos se definirá posteriormente.

## 31. NIVELES

Inicio: Nivel 0, 0 XP. Objetivo: 0–100.

Propuesta conceptual: XP necesario nivel N = 100 × N^1.35.

Los parámetros deben permanecer configurables. No dispersar constantes mágicas por la aplicación.

## 32. FORMA

Forma reciente: últimos 5 partidos clasificatorios.

Ejemplo: G G G P G.

No modifica directamente el ELO. Se utiliza para información/analítica.

## 33. PREDICCIÓN PREPARTIDO

En partidos clasificatorios se quiere mostrar en el futuro una previsión ESTADÍSTICA. NO una certeza.

Factores propuestos:

- ELO → 60%;
- Head-to-head → 25%;
- Forma → 15%.

Con pocas partidas entre rivales: reducir o ignorar H2H.

Confianza:

- <5 enfrentamientos: BAJA;
- 5–14: MEDIA;
- 15+: ALTA.

Ejemplo visual: Blanco 46%, Azul 54%.

Mostrar también últimos 5 resultados clasificatorios.

## 34. LOGROS

Objetivo futuro: aproximadamente 50 logros + aproximadamente 10 secretos opcionales.

Categorías:

- progresión;
- victorias;
- rachas;
- goles;
- competición;
- situaciones especiales.

Premio XP: una sola vez. No permitir farmear repetidamente un logro único.

## 35. RÉCORDS

Ejemplos:

- gol más rápido;
- mayor goleada;
- más goles en un partido;
- racha más larga;
- más partidos;
- ELO más alto;
- mayor remontada;
- partido más largo;
- más victorias;
- mejor porcentaje de victorias;
- máximo ELO histórico.

Habrá un futuro HALL OF FAME con líderes visuales.

Un récord puede cambiar múltiples veces. Pero no debe conceder XP ilimitado por cada actualización salvo reglas explícitas.

## 36. TORNEOS

Existe opción TORNEO en menú. Funcionalidad detallada: PENDIENTE.

No inventar reglas complejas todavía. La arquitectura sí debe permitir añadir torneos posteriormente.

## 37. ARQUITECTURA DEL SOFTWARE

Separar responsabilidades. Conceptualmente:

- UI;
- Match Engine;
- Inputs;
- Players;
- Persistence;
- History;
- XP/Levels;
- ELO;
- Ranking;
- Achievements;
- Records;
- Sound;
- System;
- OTA;
- Test Mode;
- ESP32-C3 communication.

Evitar dependencias innecesarias entre módulos.

## 38. MATCH ENGINE

El MatchEngine es una pieza crítica. Debe ser independiente de React, Supabase, Vercel, hardware y componentes visuales.

Ampliación implementada el 2026-10-01: exporta/restaura checkpoints versionados y validados sin acceder al almacenamiento. Conserva el contador de IDs, tiempo acumulado y bloqueo central; la capa de aplicación decide cuándo escribirlos. Recuperar juego activo lo deja en pausa, sin sumar el tiempo que estuvo cerrado. Cuenta atrás, descansos, penaltis y finales mantienen su flujo correspondiente.

Debe gestionar reglas del partido. Actualmente controla o debe controlar:

- puntuación;
- tiempo;
- estados;
- countdown;
- partes;
- bloqueo de gol;
- pausa;
- undo;
- prórroga;
- gol de oro;
- penaltis;
- eventos.

NO introducir llamadas Supabase dentro del MatchEngine.

## 39. ABSTRACCIÓN DE INPUT

Todas las entradas deben converger conceptualmente en una capa común.

Fuentes HOY: pantalla/mouse/touch.

FUTURO:

- botón Blanco;
- botón Azul;
- ESP32-C3;
- sensores automáticos.

El MatchEngine no debe necesitar saber físicamente de dónde vino el gol.

Ejemplo conceptual: GOAL_WHITE, GOAL_BLUE. El motor decide si el evento es válido.

## 40. HARDWARE FINAL

Pantalla principal: ESP32-S3 7inch AI Voice Touch Display Development Board.

Características aportadas por el propietario:

- 800×480;
- IPS;
- 5-point touch;
- 2.4GHz Wi-Fi;
- BLE 5.

Altavoz: 2030 Cavity Speaker Type B, 8Ω, 2W, 2PIN PH1.25.

Auxiliar: ESP32-C3 Mini Development Board, ESP32-C3FH4, 160 MHz, Wi-Fi, Bluetooth 5.

Botones:

- Pulsador gigante 100mm BLANCO con LED, arcade 5V/12V;
- Pulsador gigante 100mm AZUL con LED, arcade 5V/12V.

Objetivo: botón Blanco → gol Blanco; botón Azul → gol Azul.

## 41. ARQUITECTURA FÍSICA PREVISTA

ESP32-S3:

- cerebro principal;
- pantalla;
- interfaz;
- lógica principal.

ESP32-C3:

- botones;
- sensores;
- entradas físicas auxiliares.

Touch: menús, configuración, controles.

Botones físicos: goles. Speaker: audio.

Wi-Fi:

- sincronización;
- Supabase si procede;
- OTA;
- posible administración web local.

## 42. SENSORES AUTOMÁTICOS

Se quieren poder añadir posteriormente sensores de gol. No se ha elegido necesariamente el sensor definitivo.

La arquitectura actual debe permitir sensor → Input Adapter → Match Engine sin reescribir las reglas del partido.

## 43. OFFLINE FIRST PARA PARTIDOS

REGLA CRÍTICA: UN FALLO DE INTERNET NUNCA PUEDE PARAR UN PARTIDO.

Durante el partido: NO depender de Supabase para cada gol. Mantener el estado localmente.

Recuperación web implementada el 2026-10-01: solo con MODO PRUEBA OFF, copia en localStorage aislada por proyecto/cuenta, tras acciones y cada segundo de reloj. Conserva partido, participantes y journal completos con el mismo ID. La app ofrece recuperación explícita al volver a cargar. No cambia el reloj por tiempo de cierre; el plazo real de bloqueo de gol sí puede expirar. MODO PRUEBA ON no escribe estas copias ni colas de partidos.

La copia activa se libera únicamente tras entregar el resultado a la cola durable o confirmar guardado. Fallos de almacenamiento avisan y no detienen el motor. Copias dañadas/incompatibles o de otro partido no se sobrescriben silenciosamente. Usar una sola pestaña activa; no es sincronización entre dispositivos ni backup. Requiere mismo navegador, origen y cuenta. Consultar `VERIFICACION_RECUPERACION.md` y el estado real de la rama.

Ampliación PWA web implementada el 2026-10-01: el build precachea únicamente recursos estáticos con lista exacta y permite arranque offline después de una primera carga completa con conexión. AJUSTES muestra disponibilidad e instalación cuando el navegador lo permite. Requiere HTTPS (localhost admitido para pruebas); no se activa en el servidor de desarrollo. Las actualizaciones esperan al cierre de la app sin forzar recarga. No se cachean APIs, respuestas Auth, tokens ni datos personales por el service worker.

Un selector local versionado conserva solo el ID de la última cuenta para acceder sin red a sus jugadores/copia/cola locales; no autoriza acceso remoto. La sesión SDK y RLS siguen siendo necesarias para sincronizar. Cerrar sesión olvida el selector, no destruye resultados pendientes. No se garantiza recuperación si se borran los datos del navegador; no hay primera carga offline ni transferencia automática PC/móvil. Evidencia y límites en `VERIFICACION_PWA.md`.

Al terminar: persistir/sincronizar.

Si falla Internet:

- conservar partido pendiente;
- informar;
- permitir reintento;
- no perder resultado.

Esto será todavía más importante en ESP32.

## 44. SUPABASE

Existe un proyecto específico:

- Nombre: MARCADOR FUTBOLIN V3;
- Project ID: unemjyfhzljcdjcbiiwh;
- Región: eu-west-1;
- Organización: Altocu;
- cuando fue creado: estado ACTIVE_HEALTHY.

REGLA ECONÓMICA: NO ACTIVAR NADA DE PAGO.

El usuario no quiere pagar por infraestructura. Si cualquier operación puede generar coste: DETENERSE ANTES e informar.

No tocar otros proyectos Supabase. Especialmente NO tocar CarteraInversiones ni altocu87's Project.

Existe un proyecto antiguo llamado Ardilla que estaba INACTIVE. No tocarlo salvo instrucción explícita.

## 45. SEGURIDAD SUPABASE

Nunca:

- service_role en navegador;
- secretos en GitHub;
- secretos en VITE_*;
- tablas sensibles abiertas sin evaluar seguridad.

Usar:

- publishable key / clave pública apropiada;
- RLS;
- policies;
- constraints;
- claves foráneas.

Consultar documentación Supabase actual antes de tomar decisiones sensibles. Supabase cambia con frecuencia.

Acceso web V1: cuenta de operador por correo/contraseña, con confirmación; los jugadores son registros gestionados por esa cuenta, no usuarios Auth obligatorios. Los datos se mantienen privados por owner_id/RLS. El registro solicita retornar al origen actual y debe tener esa URL exacta autorizada en Supabase. No compartir sesiones/tokens entre dominios ni desactivar confirmación para facilitar pruebas. El SMTP predeterminado es para pruebas con correos del equipo y tiene límites; abrir registro a otros correos requiere configurar envío autorizado, sin asumir costes ni contratar servicios automáticamente.

## 46. MODELO DE DATOS V1 PREVISTO

Primera persistencia debería centrarse en players, matches, match_participants y match_events.

No empezar creando 30 tablas innecesarias. Construir progresivamente.

## 47. PLAYERS

Conceptualmente:

- id;
- name;
- nickname opcional;
- photo_url opcional;
- active;
- created_at;
- updated_at.

Puede ser útil preparar level = 0, xp = 0, elo = 1200, max_elo = 1200, classified_matches = 0, pero sin implementar aún necesariamente toda la lógica.

## 48. MATCHES

Debe permitir reconstruir el partido. Conceptualmente:

- id;
- match_type;
- status;
- victory_condition;
- goal_limit;
- time_limit_seconds;
- white_score;
- blue_score;
- winner_team;
- started_at;
- finished_at;
- went_to_extra_time;
- went_to_penalties;
- test_mode;
- created_at;
- updated_at.

Añadir campos necesarios si la arquitectura real lo requiere.

## 49. MATCH_PARTICIPANTS

Relaciona partido ↔ jugadores.

Conceptualmente:

- id;
- match_id;
- player_id;
- team;
- position;
- created_at.

team: white, blue. Soportar 1v1 y 2v2.

## 50. MATCH_EVENTS

Cronología. Tipos posibles:

- goal;
- score_correction;
- undo;
- period_start;
- period_end;
- extra_time_start;
- penalty;
- match_end.

Conceptualmente:

- id;
- match_id;
- event_type;
- team nullable;
- period;
- match_time_seconds;
- white_score;
- blue_score;
- sequence;
- metadata;
- created_at.

No almacenar goleador individual.

## 51. BORRADO DE JUGADORES

No destruir historial accidentalmente. Preferencia: baja lógica. Ejemplo: active = false.

Los jugadores inactivos siguen apareciendo en historial y no aparecen normalmente para nuevos partidos.

## 52. PERSISTENCE LAYER

No llamar Supabase directamente desde 20 componentes React. Utilizar repositorios/servicios.

Ejemplos conceptuales:

PlayerRepository:

- getPlayers();
- createPlayer();
- updatePlayer();
- deactivatePlayer().

MatchRepository:

- saveMatch();
- getMatches();
- getMatchById().

Esto permitirá sustituir/adaptar persistencia posteriormente para ESP32.

## 53. GUARDADO DEL PARTIDO

MatchEngine: NO guarda en Supabase.

Al finalizar: Application layer → transforma estado/eventos → persistence layer → Supabase.

Guardar de forma consistente match, participants y events. Evitar estados parciales.

Valorar transacción/RPC si resulta apropiado y seguro.

## 54. VERCEL

Vercel se utiliza para publicar la versión web. Repositorio GitHub debe ser la fuente.

Stack Vite: Build command normalmente npm run build. Output: dist.

No activar servicios de pago.

Decisión del 2026-10-01: el propietario autoriza publicar una vista previa de desarrollo para verla desde el móvil sin depender del PC. La integración GitHub del proyecto existente ya genera estas vistas; reutilizar la publicación correcta antes de crear despliegues redundantes. Mantener protección de acceso y no promover a producción/main mientras siga pendiente la validación autenticada de la fase B. Una vista previa publicada no demuestra que la persistencia esté configurada ni probada. Enlaces y estado comprobado en ESTADO_ACTUAL.md.

## 55. GITHUB

GitHub es la fuente principal/versionada.

Flujo: desarrollo → tests → build → commit → push → deployment.

Evitar commits rotos en main. Para cambios grandes, rama/PR es aceptable si mejora seguridad.

## 56. ESTADO FUNCIONAL CONOCIDO DE LA V1

En la primera V1 funcional se implementó:

- menú;
- Nuevo Partido;
- Rápido;
- Caos;
- Clasificatorio;
- configuración goles/tiempo/ambos;
- selección demo hasta 4 jugadores;
- countdown 3-2-1;
- marcador táctil;
- reloj;
- periodos;
- pausa;
- continuar;
- undo;
- -1;
- bloqueo 3 segundos;
- eventos locales;
- efectos de gol;
- primera parte;
- segunda parte;
- prórroga;
- gol de oro;
- penaltis;
- panel discreto de simulación hardware;
- pantallas provisionales Torneo/Ranking/Ajustes.

IMPORTANTE: revisar código actual para comprobar qué ha cambiado desde entonces.

## 57. ARCHIVOS IMPORTANTES CONOCIDOS

En la V1 existían:

- src/main.tsx;
- src/app/App.tsx;
- src/styles/global.css;
- src/ui/layout/FixedCanvas.tsx;
- src/ui/components/TopMenu.tsx;
- src/ui/screens/NewMatchScreen.tsx;
- src/ui/screens/MatchFlow.tsx;
- src/match-engine/MatchEngine.ts;
- src/match-engine/types.ts;
- src/inputs/MatchInput.ts;
- src/inputs/ScreenMatchInput.ts;
- src/services/persistence/MatchRepository.ts;
- tests/matchEngine.test.ts.

No asumir que siguen exactamente iguales. Inspeccionar repositorio.

## 58. TESTS CONOCIDOS

Existía npm run test:engine.

Se probaron:

- countdown;
- bloqueo 3 segundos;
- undo;
- pausa;
- cambio de parte;
- prórroga;
- gol de oro;
- penaltis.

También npm run build pasaba sin errores TypeScript.

Nunca romper estos comportamientos sin motivo explícito.

## 59. DECISIÓN SOBRE CONDICIÓN DE GOLES

En la V1 se tomó la decisión: la condición de goles se evalúa POR PERIODO, mientras el marcador total permanece visible durante todo el partido.

Si al revisar código esta decisión genera inconsistencias con las reglas actuales, NO cambiarla silenciosamente. Documentar y consultar si supone un cambio funcional.

## 60. AJUSTES FUTUROS

Ajustes debería acabar incluyendo:

- jugadores;
- equipos;
- volumen;
- modo prueba;
- sistema;
- firmware;
- información;
- OTA;
- reiniciar;
- backup;
- import/export.

No implementar todo de golpe.

## 61. PANTALLA DE REPOSO

Futuro: tras inactividad, fondo casi negro, reloj digital, fecha y brillo reducido.

Despertar: toque. Pensado para proteger pantalla/reducir consumo.

## 62. OTA

En hardware final: actualizaciones OTA por Wi-Fi.

Debe existir una experiencia sencilla porque el usuario no tiene conocimientos técnicos avanzados.

No implementar todavía si estamos en fase web.

## 63. BACKUP

Futuro: exportar/importar jugadores, historial, configuración y estadísticas.

Útil antes de actualizaciones y para recuperación.

## 64. ADMINISTRACIÓN LOCAL

Posibilidad futura: ESP32 crea interfaz web local vía Wi-Fi.

Desde móvil/PC se podrían administrar jugadores, backups, configuración y actualizaciones.

No es prioridad actual.

## 65. PRINCIPIO UX

El usuario final puede estar jugando y cansado/moviéndose.

Por ello NO:

- formularios pequeños durante partido;
- botones diminutos;
- menús profundos;
- confirmaciones innecesarias;
- texto excesivo.

SÍ:

- acciones grandes;
- contraste;
- feedback inmediato;
- jerarquía clara.

## 66. PRINCIPIO DE DESARROLLO

El propietario no es programador ni experto en electrónica. Codex debe trabajar con ALTA AUTONOMÍA.

No pedir permiso para:

- crear archivos;
- refactor normal;
- ejecutar tests;
- instalar dependencia necesaria;
- corregir errores;
- mejorar tipos;
- reorganizar módulos razonablemente.

DETENERSE si:

- puede generar coste;
- requiere credenciales;
- requiere autorización externa;
- puede borrar datos;
- cambia reglas funcionales importantes;
- existe una decisión de producto realmente ambigua.

## 67. NO SOBREINGENIERÍA

No construir de golpe:

- microservicios;
- sistemas distribuidos;
- arquitectura enterprise;
- decenas de tablas vacías;
- abstracciones sin uso;
- infraestructura de pago.

Es un marcador doméstico/privado pero queremos código de buena calidad y extensible.

Preferir simple + modular + robusto.

## 68. PRIORIDAD DE FIABILIDAD

Orden de prioridades durante un partido:

1. Registrar correctamente goles.
2. No registrar goles dobles.
3. Mantener marcador correcto.
4. Mantener tiempo/estado.
5. No perder partido.
6. UI.
7. Nube/estadísticas.

Nunca sacrificar 1–5 por funciones online.

## 69. PRÓXIMA FASE ACTUAL

Actualización posterior, 2026-10-01: el propietario autoriza avanzar a estadísticas básicas/perfiles (primer bloque C), sin cerrar artificialmente B ni promover a main. Lecturas privadas desde resultados existentes, sin nuevas tablas ni contadores. Se excluyen prueba/pendientes, se deduplican IDs y se recorre el historial completo con cursor. Los penaltis deciden el ganador sin añadirse a goles del partido. XP/ELO y el resto de fases permanecen fuera del bloque. Ver ESTADO_ACTUAL.md y VERIFICACION_ESTADISTICAS.md.

Siguiente ampliación autorizada e implementada: análisis de últimos resultados/rachas, formatos, filtros y evolución en el perfil. Fechas locales inclusivas y orden cronológico estable; rango inválido no sustituye el filtro vigente. Reutiliza la lectura completa en memoria para mantener coherencia entre análisis e historial paginado. El acceso autenticado real sigue pendiente; no cambia esa condición de cierre ni promueve main.

La siguiente gran fase prevista es PERSISTENCIA SUPABASE V1.

Actualización de traspaso del 2026-10-01: esta fase ya tiene cliente/Auth, jugadores, repositorios, guardado transaccional, historial, cola offline, recuperación y PWA implementados en la rama de desarrollo. No es una orden de rehacerlos. Sigue abierta por la verificación autenticada navegador → Supabase y la revisión/promoción pendientes. Consultar ESTADO_ACTUAL.md para las referencias y bloqueos reales.

Objetivo: jugadores reales + partidos persistentes + participantes + eventos + historial básico.

NO implementar todavía:

- ELO real;
- XP real;
- niveles completos;
- categorías;
- logros;
- récords;
- Hall of Fame;
- predicción;
- torneos completos;
- ESP32;
- OTA;
- sensores.

## 70. TAREA ACTUAL — SUPABASE V1

Revisar primero el estado actual del repo. Después implementar progresivamente:

A. Supabase client.

B. Variables VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o equivalente publishable actual.

C. Esquema players, matches, match_participants, match_events.

D. RLS y seguridad.

E. Repositories.

F. Gestión de jugadores.

G. Selección de jugadores reales.

H. Guardado al finalizar partido.

I. Modo prueba.

J. Historial V1.

K. Tolerancia a pérdida de Internet.

## 71. GESTIÓN DE JUGADORES V1

En AJUSTES: listar, crear, editar, activar/desactivar.

No hace falta todavía editor avanzado de fotografía.

Jugadores activos: seleccionables. Inactivos: conservar en historial.

## 72. SELECCIÓN DE JUGADORES

Nuevo Partido: obtener jugadores activos. Permitir máximo 4.

Debe quedar claro BLANCO y AZUL. Validar configuración. Soportar 1v1 y 2v2.

## 73. HISTORIAL V1

Pantalla inicial sencilla.

Lista:

- fecha;
- tipo;
- equipos/jugadores;
- resultado;
- ganador;
- prórroga;
- penaltis.

Detalle:

- configuración;
- participantes;
- resultado;
- cronología.

Optimizar para 800×480.

## 74. ERRORES DE NUBE

Si Supabase falla: NO romper la partida.

Durante partido: seguir local. Al finalizar: intentar guardar.

Si falla: mostrar aviso, mantener copia pendiente si es viable, permitir reintentar.

No perder el resultado silenciosamente.

Refuerzo del coordinador web, 2026-10-01: cada intento de guardado tiene un límite de diez segundos. Si la petición no responde, conserva el agregado local y permite continuar/reintentar. Las respuestas tardías se recuperan con el mismo ID mediante guardado idempotente, sin retirar otros partidos pendientes. La recuperación de partidas en curso es una copia independiente, descrita en el apartado 43; ninguna de estas copias sustituye un backup.

Panel local de pendientes y reconexión, 2026-10-01: AJUSTES permite ver resultado, participantes y cronología de la cola sin consultar Supabase. Con la app abierta, sesión válida y servidor accesible, se intenta sincronizar al reconectar o cambiar la cola, fuera de un partido en curso/guardado activo; no hay bucle ante el mismo fallo ni sincronización en segundo plano con la app cerrada. Se mantiene reintento manual y UUID estable. El indicador ONLINE verifica únicamente el servidor web mediante una sonda no cacheada; no equivale a salud/autorización de Supabase. SIN CONEXIÓN es ámbar. Estos módulos no participan en la validación de goles del motor.

## 75. TYPESCRIPT

Evitar any.

Separar tipos MatchEngine, tipos persistencia y tipos UI.

Generar tipos Supabase si es útil. No convertir el esquema SQL en la arquitectura completa de la aplicación.

## 76. VERIFICACIÓN

Antes de dar una fase por terminada:

- tests existentes;
- tests nuevos;
- TypeScript;
- build;
- comprobación visual;
- consola;
- Git status;
- secretos;
- 800×480.

Como mínimo npm run test:engine y npm run build, si esos scripts siguen existiendo.

La rama de desarrollo incorpora npm run test:offline junto a motor, persistencia y recuperación en npm test. Verificar el service worker del build y reapertura con el servidor realmente apagado; una fixture con guardado simulado no sustituye esa prueba ni el recorrido Auth/Supabase real.

Desde el bloque responsive, npm run test:layout verifica preferencia/escala física y marcado accesible del menú, selector y modalidades. Tras el bloque de registro, npm test ejecuta seis grupos: motor, persistencia, recuperación, offline, layout y Auth. El test:auth usa transporte aislado, no valida cuentas reales. Verificar ambas vistas, móvil vertical/horizontal, tablet y escritorio, continuidad del estado al redimensionar, navegación real y ausencia de solapamientos. Evidencia en VERIFICACION_RESPONSIVE.md y VERIFICACION_VERCEL_DATOS.md.

Revisión cloud del 2026-10-01: `npm run test:browser` añade cinco recorridos reproducibles sobre builds y fixture aislada, incluido servidor realmente apagado. No sustituye la cuenta/RPC reales. Al vencer el reloj se publica únicamente el estado definitivo de fin de parte; un tick retrasado no suma tiempo después del límite. Se mantienen los tiempos de journals/copias V1 anteriores para no retrocederlos. No cambia la condición GOALS por periodo, los tres segundos de bloqueo ni las reglas de penaltis. Evidencia en VERIFICACION_NUBE.md y estado operativo en ESTADO_ACTUAL.md.

Bloque posterior de estadísticas: `npm test` añade test:statistics (siete grupos); test:browser amplía a ocho recorridos. Probar más de 20 partidos, 1v1/2v2, reintentos, anulaciones, gol de oro/penaltis, jugadores inactivos/renombrados, errores y cancelación. Comprobar navegación, historial filtrado y controles visibles en web/800×480. No confundir pruebas SDK con transporte aislado con una consulta autenticada del proyecto real.

Ampliación de análisis: test:statistics suma 41 casos; test:browser, diez recorridos. Añade rachas/empates, filtros combinados, límites inclusivos, días de 23/25 horas, precisión temporal, evolución sobre 200 resultados, gráfico acotado, rango inválido, filtro vacío, vuelta del historial y pérdida/reconexión conservando filtro. Verificar formularios, tablas y gráfico con scroll interno en móvil y referencia física. Las cifras actuales de comprobación están en ESTADO_ACTUAL.md.

## 77. VERIFICACIÓN VISUAL

Probar:

- Menú → Ajustes → Jugadores → Crear/editar.
- Nuevo Partido → modo → configuración → jugadores → countdown → partido → final → guardado.
- Historial → lista → detalle.

Comprobar:

- 800×480;
- no scroll general;
- nada cortado;
- botones táctiles;
- textos legibles;
- consola sin errores relevantes.

## 78. POLÍTICA DE COSTES

CRÍTICO: el propietario NO QUIERE PAGAR por servicios cloud.

Proyecto Supabase fue creado después de que el sistema indicase coste 0 €/mes.

No activar planes, add-ons, almacenamiento de pago, servicios premium ni recursos de pago sin autorización explícita.

Misma regla para Vercel, GitHub y otros servicios.

## 79. FORMA DE TRABAJAR EN CODEX CLOUD

Cuando se trabaje en un entorno Codex en la nube, el repositorio GitHub es la referencia compartida.

Antes de modificar: identificar rama/commit/árbol/remoto, consultar las referencias remotas y sincronizar de forma segura; no usar pull, reset, stash ni checkout que sobrescriban trabajo ajeno. Después: tests, build, contexto actualizado, commit y push cuando estén autorizados.

Decisión del propietario del 2026-10-01: preparar el traspaso documentado para continuar el desarrollo en la nube. Leer además TRASPASO_NUBE.md. La configuración inicial cloud se preparó con main, pero los avances posteriores están en una rama de desarrollo; usar la referencia indicada en ESTADO_ACTUAL.md, no recrear la integración ni fusionar a main para cambiar de entorno.

El contexto compartido viaja por GitHub, no por el historial de un chat. .env.local, sesiones, credenciales CLI, capturas temporales y partidas pendientes de un navegador no se transfieren. Configurar por separado las variables públicas necesarias en el entorno cloud y comprobar permisos/herramientas disponibles. Un conector conectado en otra conversación no demuestra acceso en la tarea nueva. Si no hay navegador disponible en la nube, registrar esa limitación y coordinar la prueba real con el propietario; nunca sustituirla por mocks ni rebajar seguridad.

No depender de rutas Windows locales anteriores. No asumir acceso al hardware físico.

Para hardware real, posteriormente se utilizará entorno local/PC cuando sea necesario.

Nota contextual: el texto original de este apartado situaba al agente en la nube. Esa descripción no sustituye la comprobación del entorno real; el trabajo de persistencia documentado el 2026-10-01 se realizó localmente.

## 80. INFORME DESPUÉS DE CADA BLOQUE

Al terminar un bloque importante informar:

1. Qué se ha hecho.
2. Archivos principales modificados.
3. Cambios de base de datos.
4. Tests.
5. Build.
6. Verificación visual.
7. Commit.
8. Push.
9. Problemas pendientes.
10. Decisiones tomadas.
11. Próximo bloque recomendado.

No limitarse a decir "terminado".

## 81. REGLA PARA CAMBIOS FUTUROS

Si el código actual contradice este documento, primero determinar si:

A. el código está incompleto/erróneo;

o

B. existe una decisión posterior que este documento no conoce.

No sobrescribir silenciosamente una implementación más reciente. Usar historial Git cuando sea útil.

## 82. OBJETIVO A MEDIO PLAZO

Secuencia general prevista:

- FASE A: Simulador funcional [YA CONSEGUIDA EN V1].
- FASE B: Persistencia Supabase [FASE ACTUAL].
- FASE C: Estadísticas + XP + niveles.
- FASE D: ELO + ranking + categorías + forma.
- FASE E: Logros + récords + Hall of Fame.
- FASE F: Torneos.
- FASE G: Pulido audiovisual.
- FASE H: Integración ESP32-S3 / ESP32-C3.
- FASE I: Botones físicos / sensores / audio.
- FASE J: OTA + backup + administración.

El orden puede ajustarse si técnicamente tiene sentido.

## 83. OBJETIVO FINAL

El resultado debe sentirse como un PRODUCTO REAL instalado en una mesa de futbolín.

No como demo web, panel administrativo, página convencional ni proyecto Arduino improvisado.

Debe combinar interfaz arcade moderna + reglas fiables + estadísticas profundas + hardware sencillo de usar + funcionamiento offline robusto.

## 84. PRIMERA ACCIÓN EN ESTE ENTORNO

Al iniciar o retomar el bloque autorizado:

1. Inspeccionar el repositorio completo.
2. Identificar el commit actual.
3. Ejecutar los tests existentes.
4. Ejecutar build.
5. Comparar el estado real con este contexto.
6. NO reescribir código que ya funciona.
7. Determinar cuánto de la fase Supabase V1 está ya implementado.
8. Continuar desde el punto real en que esté el repositorio.

Trabajar autónomamente.

Si la fase Supabase todavía no está empezada, comenzar por integración limpia del cliente, modelo de datos, RLS, repositorios y jugadores. Después, persistencia de partidos, historial y offline básico.

No avanzar todavía a XP/ELO/logros salvo que el repositorio ya contenga trabajo previo que necesite preservarse.

Al terminar, proporcionar un informe completo del estado alcanzado.

Esta pauta no autoriza por sí sola iniciar una fase nueva al leer documentación: atender la petición vigente y el estado actualizado, especialmente los cambios locales y migraciones ya aplicadas pendientes de sincronización.
