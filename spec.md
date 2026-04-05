# CinePareja

## Current State
La app tiene una pestaña "Viendo" (WatchingTab) que muestra todos los títulos agrupados por estado: Viendo, Pendiente y Completada. Los ítems con estado `completed` aparecen al final de esta sección junto a los demás. El backend ya soporta el campo `status: completed` en WatchItem, así como campos `review`, `rating` y `currentEpisode`.

## Requested Changes (Diff)

### Add
- Nueva pestaña "Terminados" en la barra de navegación inferior (entre Álbum y Datos, o al final)
- Componente `FinishedTab` que muestra únicamente los WatchItems con `status === completed`
- Dentro de cada tarjeta de título terminado, mostrar: título, tipo (película/serie), puntuación con estrellas, reseña/opinión completa (no truncada), episodio final si aplica
- Botón para editar la reseña/puntuación directamente desde FinishedTab (reutilizar el dialog del WatchingTab o un dialog simplificado)
- Posibilidad de volver a mover un título a "Viendo" si se quiere (cambiar estado desde el formulario)
- Estado vacío amigable si no hay títulos terminados aún

### Modify
- App.tsx: añadir nueva tab `terminados` al array TABS con un icono apropiado (CheckCircle o Trophy)
- WatchingTab: los ítems con estado `completed` pueden quedarse aquí también (no eliminarlos), pero la sección "Terminados" es el lugar principal para revisarlos con detalle

### Remove
- Nada se elimina

## Implementation Plan
1. Crear `src/frontend/src/components/FinishedTab.tsx` con la lista de títulos completados, tarjetas expandidas con reseña completa y estrellas, y dialog de edición de reseña/puntuación
2. Modificar `App.tsx` para añadir `terminados` al tipo TabId, al array TABS (con icono CheckCircle) y al switch de renderizado de pestañas
3. Asegurarse de que FinishedTab reutiliza los mismos hooks (useGetAllWatchItems, useUpdateWatchItem) que WatchingTab
