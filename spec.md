# CinePareja

## Current State
El proyecto está vacío (borrador expirado). Se reconstruye desde cero con todas las funcionalidades de la Versión 6.

## Requested Changes (Diff)

### Add
- Aplicación completa CinePareja como PWA
- Autenticación con Internet Identity
- Sistema de invitación para parejas (compartir enlace)
- Sincronización en tiempo real de todos los datos entre ambos usuarios
- Modal de bienvenida para ingresar nombres (por defecto: Diana y David)
- Pestaña Películas/Series: seguimiento de progreso (episodios, temporadas, puntuaciones), marcar como visto, pendiente, favorito
- Pestaña Lista: watchlist compartida de películas y series pendientes
- Pestaña Comidas: planificador de comidas diario (desayuno, almuerzo, cena) con posibilidad de añadir platos personalizados
- Pestaña Álbum: subida de fotos organizadas por día/mes/año con títulos y descripciones opcionales por día
- Pestaña Datos: muestra resumen de todas las estadísticas, sección de fotos organizadas por fecha, botón de descarga en formato PNG romántico (1080x1920px)
- Exportación PNG: fondo degradado romántico, corazones decorativos, fotos por fecha, resumen al pie, nombres personalizables en cabecera
- Blob storage para fotos del álbum
- Diseño visual atractivo y romántico para parejas

### Modify
- N/A (reconstrucción completa)

### Remove
- N/A

## Implementation Plan
1. Seleccionar componentes: authorization, blob-storage, invite-links
2. Generar backend Motoko con: gestión de usuarios/parejas, películas/series con progreso, watchlist, planificador de comidas, álbum de fotos con metadatos de fecha/título/descripción, configuración de nombres
3. Desarrollar frontend React con 5 pestañas, autenticación II, sistema de invitación, exportación canvas PNG romántica
4. Asegurar que las fotos se muestren correctamente en el álbum (fix del bug de versión anterior)
5. Validar y desplegar
