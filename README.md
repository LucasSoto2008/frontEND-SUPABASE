# Holocron & Bounty Guild 🚀

Proyecto Fullstack desarrollado para el **Taller de Construcción de Software**.
Esta aplicación es un tablero interactivo de misiones inspirado en el universo de Star Wars, utilizando **React (Vite)** para el Frontend y **Supabase** como Backend as a Service (BaaS).

## 📋 Requisitos del Proyecto Cumplidos

1. **Base de Datos (PostgreSQL):** Esquema relacional con tablas para perfiles, planetas, naves y misiones (`schema.sql`).
2. **Autenticación:** Sistema de Auth con correo/contraseña y OAuth (Google/GitHub). Incluye recuperación de contraseña.
3. **Triggers Automáticos:** Trigger en PostgreSQL que crea el perfil automáticamente cuando un nuevo usuario se registra.
4. **Row Level Security (RLS):** Políticas de seguridad en todas las tablas para proteger la lectura/escritura según el rol y creador.
5. **Storage:** Bucket `holocron-assets` configurado para subir avatares e imágenes de naves.
6. **Función (RPC):** Función de base de datos (`claim_bounty`) que recibe IDs, calcula el descuento del 10% de impuestos del gremio, actualiza los saldos y marca la misión como completada (reemplaza a la Edge Function por facilidad de despliegue).
7. **Realtime:** Suscripción por WebSockets (Supabase Realtime) al tablero de misiones. Cuando alguien crea, borra o cobra una misión, la lista se actualiza automáticamente para todos los usuarios conectados sin recargar la página.

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Backend:** Supabase (Auth, Database PostgreSQL, Storage, Realtime, RPC).

## 🚀 Instalación y Uso

1. Clonar el repositorio.
2. Ir a la carpeta del frontend: `cd frontend`
3. Instalar dependencias: `npm install`
4. Crear un archivo `.env` basado en las claves de Supabase.
5. Iniciar el servidor local: `npm run dev`

*(Nota para el profesor: El código SQL de la estructura de la base de datos se encuentra en la carpeta `/supabase`)*
