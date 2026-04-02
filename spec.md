# CinePareja

## Current State
La app CinePareja tiene un backend con autenticación (authorization component), almacenamiento de blobs (blob-storage), y funciones para películas, menú diario y álbum de fotos. El frontend tiene múltiples pestañas pero NO exige login — muestra directamente la app y sólo guarda nombres en localStorage. No hay flujo de registro ni enlace de invitación para la pareja.

## Requested Changes (Diff)

### Add
- Pantalla de login/registro con Internet Identity: al entrar a la app sin sesión, mostrar una pantalla de bienvenida con botón "Iniciar sesión" que use Internet Identity (ya disponible via `useInternetIdentity` hook).
- Flujo de invitación: el primer usuario que se registre ve un enlace/código que puede compartir con su pareja. La pareja abre ese enlace y entra directamente a la misma app compartida (ya que los datos son compartidos en el backend único).
- Pantalla de loading mientras se inicializa la sesión.
- Botón de cerrar sesión (logout) accesible desde la app.

### Modify
- `App.tsx`: añadir guard de autenticación — si no hay sesión activa (`identity` es undefined o usuario anónimo), mostrar la pantalla de login en lugar de la app principal. Mover el modal de bienvenida de nombres para que aparezca sólo tras el login.
- `WelcomeModal.tsx`: mostrar tras el primer login para que el usuario configure su nombre.
- `HomeTab.tsx`: añadir botón de cerrar sesión en el header.
- Integrar el enlace de invitación en la pantalla principal o en el HomeTab para que sea fácil de copiar y compartir.

### Remove
- La lógica de mostrar WelcomeModal basándose en `localStorage.getItem("partnerName1")` como única condición — ahora debe depender también del estado de autenticación.

## Implementation Plan
1. Crear componente `LoginScreen.tsx`: pantalla de bienvenida romántica con logo, descripción y botón de login con Internet Identity. Mostrar spinner durante `isInitializing`.
2. Modificar `App.tsx` para verificar estado de autenticación antes de mostrar la app. Si `isInitializing` → spinner, si sin identidad/anónimo → `<LoginScreen />`, si autenticado → app normal.
3. Crear componente `InviteSection.tsx` o integrar directamente en HomeTab: muestra la URL actual de la app con un botón de copiar, explicando que es el enlace para que la pareja entre a la misma app compartida.
4. Añadir botón de logout en `HomeTab.tsx` (icono en el header o un botón pequeño).
5. Asegurar que el modal de nombres (`WelcomeModal`) sigue apareciendo en el primer login para personalizar la experiencia.
