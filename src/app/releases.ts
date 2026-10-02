import { version } from '../../package.json'

// Version of this build, including when an older PWA is still open offline.
export const APP_VERSION = version

export const releases = [
  {
    version: '0.5.2',
    title: 'Revisión de las recompensas de logros',
    changes: [
      'Se mantienen las nueve familias y 45 estrellas desde el historial confirmado completo.',
      'Verificada la propuesta de experiencia por nivel con desglose en una revisión de datos simulados.',
      'Las estrellas siguen sin añadir experiencia; se conserva el XP de los partidos.',
    ],
    pending: 'XP extraordinario V2, récords y Hall of Fame requieren aprobación expresa. Bloque 05 abierto; torneos sin iniciar.',
  },
  {
    version: '0.5.1',
    title: 'Logros que suben de nivel',
    changes: [
      'El perfil muestra nueve familias de logros con cinco estrellas y progreso hacia el siguiente nivel.',
      'Goles de tu equipo empieza en 1, 5 y 50. Partidos y victorias empiezan en 1 y 5.',
      'Los niveles se reconstruyen desde partidos confirmados; prueba y pendientes no cuentan.',
    ],
    pending: 'XP extraordinario, récords y Hall of Fame pendientes de aprobación. Los logros de torneos esperan al bloque 06.',
  },
  {
    version: '0.5.0',
    title: 'Propuesta de logros, récords y Hall of Fame',
    changes: [
      'Preparados un catálogo de 24 logros y ocho récords, con ejemplos para revisión.',
      'Probados premios únicos, reconstrucción desde resultados y exclusión de prueba y pendientes con datos simulados.',
    ],
    pending: 'Catálogo pendiente de aprobación. Logros, récords y Hall of Fame aún no están disponibles; no se concede XP extraordinario.',
  },
  {
    version: '0.4.1',
    title: 'Enfrentamientos, forma y partidas 1 contra 2',
    changes: [
      'ELO activado con las reglas aprobadas para Clasificatorio.',
      'Perfil con enfrentamientos de jugadores y parejas exactas, filtros y últimos cinco Clasificatorios.',
      'Rápido y Caos permiten 1 contra 2, elegir el color del jugador solo y recuperar la partida.',
      'Cada jugador recibe su XP completo. 1 contra 2 queda excluido de Clasificatorio.',
      'Análisis descriptivo: no se calculan pronósticos ni probabilidades.',
    ],
  },
  {
    version: '0.4.0',
    title: 'Versiones y preparación del análisis competitivo',
    changes: [
      'La versión de la aplicación y su historial de novedades ya se pueden consultar.',
      'Preparados el diseño y las pruebas de enfrentamientos, últimos cinco clasificatorios y previsión antes de jugar.',
    ],
    pending: 'El análisis competitivo todavía no está disponible: espera la aprobación de ELO y de sus propias reglas.',
  },
  {
    version: '0.3.0',
    title: 'Clasificación competitiva preparada',
    changes: [
      'Añadidas la pantalla de clasificación privada y la información competitiva en el perfil.',
      'Preparado el cálculo de ELO, categorías y mejor puntuación a partir del historial.',
    ],
    pending: 'ELO sigue desactivado hasta aprobar las reglas de puntuación. Todavía no asigna categorías ni puestos.',
  },
  {
    version: '0.2.0',
    title: 'Experiencia y niveles',
    changes: [
      'Los partidos confirmados dan experiencia a los jugadores según el resultado.',
      'El perfil muestra el nivel, la experiencia acumulada y lo que falta para el siguiente nivel.',
      'Las partidas de prueba y los resultados pendientes no suman experiencia; los reintentos no la duplican.',
    ],
  },
  {
    version: '0.1.0',
    title: 'Cuentas, historial y juego sin conexión',
    changes: [
      'Acceso con cuenta, gestión de jugadores e historial privado de partidos.',
      'Perfiles con estadísticas, últimos resultados y filtros para consultar el historial.',
      'Recuperación de partidas y envío de resultados pendientes al volver la conexión.',
      'Aplicación instalable, vista adaptable y reglas por goles, por tiempo o ambas revisadas.',
    ],
  },
  {
    version: '0.0.0',
    title: 'Primer marcador jugable',
    changes: [
      'Simulador de partidos Rápido, Caos y Clasificatorio, con equipos Blanco y Azul.',
      'Marcador táctil, reloj, pausa, correcciones, cuenta atrás y desempates.',
    ],
  },
] as const
