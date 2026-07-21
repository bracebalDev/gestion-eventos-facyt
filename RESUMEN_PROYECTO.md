# Resumen de Desarrollo - Gestor de Eventos FaCyT

Este documento resume las funcionalidades implementadas hasta la fecha, los cambios arquitectónicos realizados en el sistema y una lista de recomendaciones sugeridas para las próximas fases de desarrollo. Su objetivo es ayudar al equipo a sincronizarse con el estado actual del proyecto.

---

## 🚀 Funcionalidades Desarrolladas

### 1. Sistema de Autenticación y Cuentas
- **Registro de Usuarios:** Los usuarios (estudiantes o directores) deben registrarse usando exclusivamente su correo institucional (`@uc.edu.ve`). Se habilitó la opción de subir una fotografía/escaneo de su carnet estudiantil para validar su identidad (almacenado en Base64).
- **Inicio de Sesión (Login):** Creada la pantalla de autenticación y conectada a la API backend. La sesión del usuario se preserva a través de reinicios usando `localStorage`.

### 2. Gestión de Roles, Permisos y Departamentos
- **Roles Diferenciados:** Existen dos roles fundamentales: `solicitante` (estudiantes/profesores) y `director` (Administradores de Departamento).
- **Protección de Datos Cruzados:** 
  - Un Director de Departamento (ej. *Computación*) solo tiene permisos para aprobar, rechazar, editar o eliminar los eventos dirigidos a su área.
  - La interfaz bloquea automáticamente las acciones destructivas si el usuario autenticado pertenece a un departamento ajeno al del evento visualizado.
  - El "Decanato" se configuró como el departamento `GENERAL` que gestiona eventos a nivel de facultad.

### 3. Asignación Estricta de Espacios (Smart Routing)
- Los "Espacios" (aulas, auditorios, laboratorios) ahora pertenecen rígidamente a un "Departamento". 
- **Automatización en el formulario:** Al momento en que un estudiante solicita crear un evento, al elegir un espacio físico determinado (Ej: *Laboratorio LCC-1*), el campo de *Departamento Responsable* se auto-selecciona en *COMPUTACIÓN* y se bloquea, asegurando que la solicitud se dirija inmutablemente a la bandeja del director correcto.

### 4. Vista de Calendario Visual
- **Desarrollo a la Medida:** Se creó una vista de calendario mensual (tipo Google Calendar) construida desde cero con React y Tailwind CSS, evitando bibliotecas pesadas.
- **Codificación por Colores:** Las "píldoras" de los eventos se colorean dinámicamente según su departamento (ej. Azul para Computación, Rojo para Química), mejorando el escaneo visual.
- **Acciones Rápidas (UX Notion-style):** 
  - Al pasar el cursor por un día en el calendario, aparece un botón para crear un evento directamente en esa fecha.
  - Al hacer clic en un evento, se despliega el panel lateral flotante derecho (Flyout) para inspeccionar y/o editar la información detallada sin perder el contexto.

### 5. Escudo de Seguridad (Anti Fuerza Bruta)
- Se implementó un middleware de **Rate Limiting** usando `express-rate-limit` en el backend para las rutas de autenticación.
- **Regla activa:** Limita a cada dirección IP a un máximo de 5 intentos de inicio de sesión o registro en un intervalo de 15 minutos, mitigando eficazmente los ataques por bots o scripts automatizados.

---

## 🛠️ Recomendaciones de Mejoras y Próximos Pasos

A continuación, se listan los aspectos técnicos que el equipo debería considerar abordar en las próximas iteraciones (Sprints):

1. **Seguridad Backend (JWT y Hashing):**
   - Actualmente, las contraseñas se envían directamente. Se recomienda urgentemente implementar `bcryptjs` en `server.ts` para aplicar *hashing* a las contraseñas antes de guardarlas en la base de datos.
   - Implementar JSON Web Tokens (JWT) para verificar los permisos en todas las rutas de la API, evitando que un atacante salte las barreras del Frontend haciendo peticiones crudas (cURL o Postman) a rutas como `PUT /api/events/:id`.

2. **Almacenamiento de Archivos (Carnets y Adjuntos):**
   - Evitar almacenar las imágenes del Carnet Estudiantil como cadenas gigantes en Base64 en el `db.json`, ya que el archivo pesará mucho rápidamente. Se sugiere configurar un servicio de Cloud Storage (AWS S3, Firebase Storage o Supabase Storage) y guardar únicamente la URL en la base de datos.

3. **Panel Administrativo General (Dashboard):**
   - Desarrollar un módulo de analíticas que muestre gráficos (ej. con la librería `recharts`) ilustrando la tasa de utilización de cada laboratorio, los departamentos con mayor actividad y un historial de eventos aprobados vs. rechazados.

4. **Prevención DDoS y CAPTCHA (Producción):**
   - Antes del despliegue público, se debe integrar un CAPTCHA (ej. Cloudflare Turnstile o reCAPTCHA) en la pantalla de inicio de sesión de `AuthScreen.tsx`. Además, orquestar el despliegue del frontend usando Vercel o Cloudflare Pages para absorber ataques de Denegación de Servicio (DDoS) volumétricos de red.

5. **Notificaciones por Correo Electrónico:**
   - Incorporar un servicio como *Resend*, *SendGrid* o *Nodemailer* para notificar a los estudiantes de manera automática cuando su evento haya sido "Aprobado" o "Rechazado" por el director de departamento.
