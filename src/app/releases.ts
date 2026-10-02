import { version } from '../../package.json'

// Version of this build, including when an older PWA is still open offline.
export const APP_VERSION = version

export const releases = [
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
