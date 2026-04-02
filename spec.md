# CinePareja

## Current State
App para parejas con:
- Registro de películas/series en seguimiento (watching), completadas, pendientes
- Menú de comidas diario
- Sincronización en tiempo real
- Modal de bienvenida para poner nombres de la pareja (guardados en localStorage)
- Backend en Motoko con WatchItem, PendingItem, MealMenu, UserProfile
- Sistema de autorización con roles

## Requested Changes (Diff)

### Add
- **Nombres de ejemplo**: En el WelcomeModal y en el HomeTab, pre-rellenar los nombres "Diana" y "David" como valores de ejemplo/placeholder (o como defaults que se puedan cambiar)
- **Álbum de fotos por día**: Nueva sección/tab "Álbum" donde la pareja puede:
  - Subir fotos organizadas por fecha (día, mes, año)
  - Ver fotos agrupadas por fecha con formato "día mes año" en español
  - Cada entrada de fecha muestra una galería de las fotos de ese día
  - Botón para añadir fotos a un día específico
  - Posibilidad de ver fotos en pantalla completa
- Backend: nuevos tipos y funciones para gestionar entradas del álbum (AlbumEntry con fecha, descripción opcional, lista de foto IDs desde blob-storage)

### Modify
- WelcomeModal: placeholders de los inputs cambiados a "Diana" y "David" respectivamente, y values por defecto si es la primera vez
- App.tsx: añadir nuevo tab "Álbum" con icono de cámara/imagen
- Footer navigation: incluir el nuevo tab de álbum

### Remove
- Nada

## Implementation Plan
1. Seleccionar componente `blob-storage` para almacenamiento de fotos
2. Actualizar backend Motoko con tipo AlbumEntry (fecha como Int timestamp, descripción, lista de blob IDs)
3. Añadir funciones CRUD para AlbumEntry en el backend
4. Actualizar WelcomeModal con placeholders "Diana" y "David"
5. Crear nuevo tab AlbumTab con:
   - Agrupación de fotos por fecha (día/mes/año en español)
   - Botón de subida de fotos que usa blob-storage
   - Galería visual con thumbnails por día
   - Modal de vista completa al pulsar una foto
6. Añadir tab "Álbum" a la navegación inferior en App.tsx
7. Añadir hook useQueries para operaciones del álbum
