# Guía de Despliegue en Vercel & Supabase
## Inovarium Inmuebles MVP

Este documento contiene las instrucciones precisas para desplegar la plataforma SaaS en producción utilizando el stack técnico solicitado.

---

### 1. Configuración de Base de Datos y Auth en Supabase

1. **Crear Proyecto en Supabase**:
   - Ve a [database.new](https://database.new) e inicia sesión con tu cuenta de GitHub.
   - Crea un nuevo proyecto llamado `Inovarium Inmuebles`.

2. **Ejecutar el Esquema SQL**:
   - Ve a la sección de **SQL Editor** en el panel izquierdo de Supabase.
   - Abre un editor en blanco e introduce el contenido del archivo `/schema.sql`.
   - Ejecuta la consulta para crear la estructura relacional de las tablas y cargar los datos de ejemplo iniciales (seed data).

3. **Configuración de Autenticación (Supabase Auth)**:
   - Ve a la pestaña **Authentication** -> **Providers**.
   - Habilita el inicio de sesión por correo electrónico (`Email / Password`) o configura un proveedor externo si lo consideras pertinente.

4. **Configuración del Storage para Evidencias**:
   - Ve a la sección **Storage** y crea un nuevo bucket público llamado `evidencias`.
   - Configura las políticas de seguridad para permitir operaciones de lectura pública y escritura a usuarios autenticados.

---

### 2. Despliegue Frontend en Vercel

1. **Subir Proyecto a GitHub**:
   - Crea un repositorio privado o público en GitHub.
   - Sube los archivos del proyecto excluyendo `node_modules` y carpetas compiladas.

2. **Vincular Proyecto en Vercel**:
   - Ve a [vercel.com](https://vercel.com) y crea un nuevo proyecto apuntando a tu repositorio de GitHub recién creado.
   - Vercel detectará automáticamente que es un proyecto de **Vite** y configurará los comandos de construcción (`npm run build` y directorio de salida `dist`).

3. **Variables de Entorno Necesarias**:
   Durante el proceso de configuración en Vercel, agrega las siguientes variables de entorno en la sección **Environment Variables**:

   | Variable | Descripción | Valor sugerido |
   | :--- | :--- | :--- |
   | `VITE_SUPABASE_URL` | Endpoint URL API de Supabase | Consíguela en Supabase: *Settings -> API* |
   | `VITE_SUPABASE_ANON_KEY` | Public Anon key secreta | Consíguela en Supabase: *Settings -> API* |
   | `RESEND_API_KEY` | API Key para envíos de correo | Obtén una key gratuita en [resend.com](https://resend.com) |
   | `GOOGLE_CALENDAR_CLIENT_ID` | Client ID de la Consola de Google | Para la integración de Google Calendar API |
   | `GOOGLE_CALENDAR_API_KEY` | API Key habilitada para Calendar API | Para consulta pública o privada de feeds |

---

### 3. Conexión de Integraciones (Google Calendar & Resend)

Una vez que los servicios en la nube estén listos, puedes reemplazar los mocks lógicos ubicados de la siguiente forma:

- **Google Calendar**:
  - Ubica la función `syncToGoogleCalendar` en `/src/services/integrations.ts`.
  - Configura el cliente de Google API cargando `@react-oauth/google` para obtener el token de consentimiento del usuario y enviar peticiones directas.

- **Recordatorios por Correo de Resend**:
  - Ubica la función `sendReminderEmail` en `/src/services/integrations.ts`.
  - Reemplaza el mock montando una llamada HTTP directa o a través de una Supabase Edge Function que utilice la biblioteca de nodemailer o la REST API de Resend para despachar las alertas con la cabecera `Authorization: Bearer RESEND_API_KEY`.
