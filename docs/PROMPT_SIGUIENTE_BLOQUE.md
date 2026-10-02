# Siguiente conversación — decisiones/implementación de 06, condicionada

Esta preparación no aprueba D1/D2/D3 ni activa torneos. El siguiente trabajo sigue
siendo 06; no avanzar a 07 antes de completar su implementación/verificación.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 en codex/reliability-offline-v1,
exclusivamente 06. Lee AGENTS, CONTEXTO_MAESTRO, ESTADO_ACTUAL,
BLOQUES_DESARROLLO, PROPUESTA_BLOQUE_06, VERIFICACION_BLOQUE_06 y catálogo/
verificación 05. Sincroniza sin sobrescribir trabajo local ni promover main.
La preparación 06 es documental, aplicación v0.5.3; D1 formato/operativa,
D2 modos/puntuación y D3 premio siguen pendientes salvo respuesta expresa
posterior del propietario. Comprueba y registra esas respuestas; no conviertas
recomendaciones en aprobación. Si faltan, prepara la revisión concreta y pide
solo las decisiones propias de 06. No actives torneos/premios sin aprobarlas.
Con propuesta aprobada, implementa íntegramente creación, equipos, cuadro,
pases libres, partidas, avance único, recuperación offline provisional,
confirmación atómica y resultado/cancelación acordados. Reutiliza el motor y
persistencia idempotente, sin nuevo modo de motor ni resultados inventados.
Cada cruce/UUID se guarda y avanza una vez; sin premio por pase, prueba,
pendiente o incompleto. Conserva copias ante conflictos y no conviertas
resultados incompatibles en partidos libres para conceder XP.
Preserva XP base/curva, ELO aprobado, 04 descriptivo y 05 activo: nueve familias/
45 tiers, identidad cuenta/jugador/familia/tier, XP V2 históricos/recálculo,
ocho récords/Hall privados con empates y 0 XP por récord. No reaprobar 02–05.
1v1/2v2 en todos los modos; 1v2 solo Rápido/Caos, XP completo y sin ELO;
la política propia de equipos de torneo será la elegida en D1. Goles de equipo,
sin inferir tiempos. RLS privada y ninguna consulta por gol.
Verifica código/UI/SQL según acceso y distingue fixtures de Preview autenticada.
No repitas cuentas/partidos del checklist cerrado. Sin administración, pagos,
Google/Drive, SMTP ni promoción main. Actualiza contexto/seguimiento y versión/
novedades al entregar funciones, publica estable en revisión y entrega el prompt
07 condicionado al cierre real de 06, sin iniciar 07.
```
