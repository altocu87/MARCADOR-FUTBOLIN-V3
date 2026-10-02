# Siguiente conversación — creador avanzado y ejecución condicionada de 06

Primero aclarar mixto y concretar opciones nuevas del generador; implementar lo
aprobado cuando se invoque este prompt y las reglas estén definidas. Esta entrega
solo documenta acuerdos y la ampliación solicitada. No iniciar 06 funcional ni 07 automáticamente.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 en codex/reliability-offline-v1 e implementa
exclusivamente 06. Lee AGENTS, contexto, estado, seguimiento, PROPUESTA_BLOQUE_06,
VERIFICACION_BLOQUE_06 y catálogo/verificación 05. Sincroniza sin sobrescribir
trabajo local ni promover main. Parte de v0.5.3, con propuesta aprobada pero sin
pool/temporadas implementadas; no repetir aprobaciones 02–05 ni de 06 ya recibidas.
Diseño acordado: pool sencilla para grupos pequeños, 1v1/2v2 y 3v3 real (tres
personas por lado). Al crear, elegir parejas/equipos fijos o mezclar ganadores,
perdedores o ambos; seguir ejemplos y concretar algoritmo de cola/saliente
propuesto, incluyendo casos sin reservas, pocos pasos y cambios entre partidos.
Sesión abierta hasta terminar, sin campeón/trofeo/XP extra; Gana torneos aparcado.

Incluye el creador avanzado solicitado además de predefinidos: TORNEOS → NUEVO →
Predefinidos/Mis tipos/Crear tipo y AJUSTES → TIPOS. Formulario ameno por pasos,
opciones condicionales y resumen/ejemplo, crear/duplicar/guardar/elegir/editar/
archivar tipos privados. Plantilla de reglas reutilizable, jugadores elegidos al
iniciar; versión/snapshot por sesión, cambios nunca alteran sesiones previas.
Aclara solo «mixto»: distintos formatos de partido en una sesión, o personas
sueltas/parejas iniciales. No repetir aprobaciones previas. Combina opciones
soportadas y compatibles, con validación UI/SQL y UUID/idempotencia/RLS de cuenta.
No convertir XP/ELO/K/tiers/premios en campos libres. Liguilla/eliminación si se
incluyen requieren reglas concretas nuevas; no reactivar V1 como aprobación ni
prometer cualquier regla imaginable. Resolver ese diseño antes de activar formatos.

Temporadas configurables en Ajustes: tres meses por defecto, seis o fechas
concretas; ELO continuo, puntos individuales reiniciados por temporada, 3 por
victoria/0 derrota, puestos compartidos si empatan puntos. Historial de temporadas,
reglas fijas al iniciar y ajustes posteriores para la siguiente. No reiniciar ELO.
Clasificatorios de pool/torneo cuentan una vez como cualquier Clasificatorio;
Rápido/Caos sin ELO ni puntos de temporada, XP habitual. Sin bonus por final/título.
Aprobación explícita 3v3 recibida: XP completo/tiers por jugador; ELO solo en
Clasificatorio con media de los tres ELO previos por lado, K propio vigente,
ajuste sin dividir, redondeo/categorías/histéresis vigentes. Puntos 3/0 por jugador.
No inventar históricos 3v3. 4v4 fue mencionado pero no ampliar elegibilidad ni
entrega por extrapolación; resolver su alcance aparte si el propietario lo pide.
Reutiliza motor y persistencia: cada ronda/UUID un resultado y cambio único,
copia/cola por cuenta y proyecto, recuperación pausada sin tiempo de cierre,
turnos offline provisionales y confirmación atómica bajo RLS. No guardar primero
como libre para vincular después, ni borrar/confundir paquetes ante conflictos.
Pausa/cierre/cancelación preservan partidos y XP/ELO legítimos; no victorias por
abandono o espera. No consultas por gol ni cachear Auth/API en service worker.
Preserva XP base/curva, ELO previo, 04 descriptivo y 05 activo: nueve familias/45
tiers, identidad cuenta/jugador/familia/tier, XP V2 históricos/recálculo y ocho
récords/Hall privados con empates compartidos y 0 XP por récord. 1v1/2v2 en todos
los modos; 1v2 solo Rápido/Caos con XP completo/sin ELO. Goles por equipo, sin
inventar goleadores o tiempos. Ampliar solo validaciones necesarias para 3v3.
Inspecciona esquema/migraciones antes de tocar SQL del proyecto autorizado.
Verifica código/UI/SQL según acceso, idempotencia/offline/mezcla/temporadas/XP/ELO,
identidad/privacidad, guardar/reutilizar/editar tipos sin alterar sesiones anteriores
y referencia 800×480. Distingue fixtures de Preview autenticada;
no repetir cuentas/partidos del checklist cerrado. Sin pagos, Google/Drive, SMTP,
administración o promoción main. Actualiza contexto/estado/seguimiento,
versión/novedades al entregar funciones, publica estable en revisión y entrega
prompt 07 condicionado al cierre real de 06, sin iniciarlo.
```
