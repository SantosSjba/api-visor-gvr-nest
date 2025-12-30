# Docker Setup para api-visor-gvr-nest

Este documento explica cómo construir, subir y desplegar la imagen Docker de la aplicación.

## 📦 Construir la imagen Docker

### Construcción local

```bash
docker build -t api-visor-gvr-nest:latest .
```

### Construcción con tag para Docker Hub

```bash
docker build -t tu-usuario/api-visor-gvr-nest:latest .
```

Reemplaza `tu-usuario` con tu nombre de usuario de Docker Hub.

## 🚀 Subir a Docker Hub

### 1. Iniciar sesión en Docker Hub

```bash
docker login
```

### 2. Etiquetar la imagen (si no lo hiciste en el build)

```bash
docker tag api-visor-gvr-nest:latest tu-usuario/api-visor-gvr-nest:latest
```

### 3. Subir la imagen

```bash
docker push tu-usuario/api-visor-gvr-nest:latest
```

### 4. Subir con versión específica (recomendado)

```bash
# Construir con versión
docker build -t tu-usuario/api-visor-gvr-nest:1.0.0 .
docker build -t tu-usuario/api-visor-gvr-nest:latest .

# Subir ambas
docker push tu-usuario/api-visor-gvr-nest:1.0.0
docker push tu-usuario/api-visor-gvr-nest:latest
```

## 🎯 Desplegar en Easy Panel

### Configuración en Easy Panel

1. **Crear nueva aplicación**
   - Tipo: Docker
   - Imagen: `tu-usuario/api-visor-gvr-nest:latest`

2. **Variables de entorno**

   **Requeridas:**

   ```env
   # Requeridas
   NODE_ENV=production
   PORT=4001
   DB_HOST=tu-host-postgres
   DB_PORT=5432
   DB_USERNAME=tu-usuario
   DB_PASSWORD=tu-password
   DB_DATABASE=tu-database
   DB_SYNCHRONIZE=false
   DB_LOGGING=false
   AUTODESK_CLIENT_ID=tu-client-id
   AUTODESK_CLIENT_SECRET=tu-client-secret
   AUTODESK_CALLBACK_URL=tu-callback-url
   ALLOWED_ORIGINS=https://tu-frontend.com,https://otro-origen.com
   
   # Opcionales
   APP_URL=https://tu-api.com  # Solo para logging/información en consola
   ```

3. **Configuración de puerto**
   - Puerto del contenedor: `4001`
   - Puerto expuesto: El que Easy Panel asigne (o el que configures)

4. **Health Check** (opcional pero recomendado)
   - Endpoint: `/api/health`
   - Intervalo: 30s
   - Timeout: 3s

5. **Recursos**
   - Memoria: Mínimo 512MB, recomendado 1GB
   - CPU: 0.5-1 core

### Notas importantes

- Asegúrate de que la base de datos PostgreSQL sea accesible desde el contenedor
- Configura `ALLOWED_ORIGINS` con los dominios de tu frontend
- `DB_SYNCHRONIZE` debe estar en `false` en producción
- El health check está configurado en el Dockerfile, pero necesitarás crear el endpoint `/api/health` en tu aplicación

## 🔧 Desarrollo local con Docker Compose

```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 📝 Comandos útiles

```bash
# Ver imágenes locales
docker images | grep api-visor-gvr-nest

# Ejecutar contenedor localmente
docker run -p 4001:4001 --env-file .env tu-usuario/api-visor-gvr-nest:latest

# Ver logs del contenedor
docker logs -f <container-id>

# Entrar al contenedor
docker exec -it <container-id> sh
```

## 🐛 Troubleshooting

### La aplicación no inicia
- Verifica las variables de entorno
- Revisa los logs: `docker logs <container-id>`
- Asegúrate de que la base de datos sea accesible

### Error de conexión a la base de datos
- Verifica `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
- Asegúrate de que el contenedor pueda acceder a la base de datos
- En Easy Panel, verifica la configuración de red

### CORS errors
- Configura `ALLOWED_ORIGINS` con los dominios correctos
- No uses `*` en producción

## Comandos para crear y subir imagen a Docker

# 1. Construir nueva imagen
docker build -t tuusuario/mi-proyecto-nestjs:latest .
docker build -t santossjba/visor-gvr:latest .

# 2. Subir a Docker Hub
docker push tuusuario/mi-proyecto-nestjs:latest
docker push santossjba/visor-gvr:latest