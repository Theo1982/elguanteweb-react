# 🚀 Guía de Deployment - ElGuanteWeb

## 📋 Pre-requisitos

### 1. Credenciales Requeridas
- **Firebase**: Proyecto configurado con Firestore, Auth, Storage
- **MercadoPago**: Access Token y Public Key
- **Twilio**: Account SID, Auth Token (opcional para WhatsApp)
- **Dominio**: Configurado con SSL

### 2. Variables de Entorno
Copia `.env.example` a `.env` y configura:

```bash
# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
# ... otras variables de Firebase

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key

# Twilio (opcional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Producción
NODE_ENV=production
WEBHOOK_SECRET=2456732e5b6db1e3bde650534665a401ca60bad9a67734f5155251fd69d37195
CORS_ORIGINS=https://yourdomain.com
```

## 🐳 Deployment con Docker

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Construir y ejecutar
docker-compose up -d

# 2. Ver logs
docker-compose logs -f

# 3. Verificar health check
curl http://localhost/health
```

### Opción 2: Docker Manual

```bash
# Frontend
docker build -t elguanteweb-frontend .
docker run -d -p 80:80 elguanteweb-frontend

# Backend
cd backend
docker build -t elguanteweb-backend .
docker run -d -p 3001:3001 --env-file .env elguanteweb-backend
```

## ☁️ Deployment en la Nube

### Vercel (Frontend)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Railway/Heroku (Backend)
```bash
# Railway
railway login
railway link
railway up

# Heroku
heroku create elguanteweb-backend
git push heroku main
```

### VPS (Servidor Propio)
```bash
# Instalar Node.js y PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clonar repositorio
git clone https://github.com/your-repo/elguanteweb.git
cd elguanteweb

# Instalar dependencias
npm install
cd backend && npm install && cd ..

# Configurar PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/elguanteweb
sudo ln -s /etc/nginx/sites-available/elguanteweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configuración Post-Deployment

### 1. Firebase Security Rules
```bash
# Deploy rules desde Firebase CLI
firebase deploy --only firestore:rules,storage
```

### 2. MercadoPago Webhooks
- URL del webhook: `https://yourdomain.com/webhook`
- Eventos: `payment.updated`

### 3. Twilio WhatsApp (Opcional)
```bash
# Configurar sandbox
# Enviar mensaje de prueba a tu número
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json \
  --data-urlencode "From=whatsapp:+14155238886" \
  --data-urlencode "To=whatsapp:+5492211234567" \
  --data-urlencode "Body=Hola desde ElGuanteWeb!" \
  -u YOUR_SID:YOUR_TOKEN
```

## 📊 Monitoreo y Mantenimiento

### Health Checks
```bash
# Health check del backend
curl https://yourdomain.com/health

# Verificar servicios
curl https://yourdomain.com/api/status
```

### Logs
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup de Base de Datos
```bash
# Exportar Firestore
firebase firestore:export --project your-project-id

# Backup automático con cron
0 2 * * * /usr/bin/firebase firestore:export --project your-project-id
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de CORS**
   - Verificar `CORS_ORIGINS` en variables de entorno
   - Reiniciar servicios

2. **Webhooks no llegan**
   - Verificar URL del webhook en MercadoPago
   - Comprobar `WEBHOOK_SECRET`

3. **Error 500 en backend**
   - Verificar logs: `pm2 logs`
   - Comprobar variables de entorno

4. **Build falla**
   - Limpiar cache: `npm run clean`
   - Verificar Node.js versión

## 📈 Escalabilidad

### Optimizaciones
- **CDN**: Configurar Cloudflare para assets estáticos
- **Cache**: Implementar Redis para sesiones
- **Load Balancer**: Nginx upstream para múltiples instancias
- **Database**: Configurar índices en Firestore

### Monitoreo Avanzado
- **Sentry**: Error tracking
- **Google Analytics**: Métricas de usuario
- **Uptime Robot**: Monitoring de uptime
- **LogRocket**: Session replay

## 🔒 Seguridad

### Checklist de Seguridad
- [ ] HTTPS configurado
- [ ] Variables de entorno no expuestas
- [ ] Firestore rules desplegados
- [ ] Webhook secret configurado
- [ ] Rate limiting activo
- [ ] CORS restrictivo
- [ ] Headers de seguridad en Nginx

## 📞 Soporte

Para problemas de deployment:
1. Revisar logs del servicio
2. Verificar configuración de variables de entorno
3. Comprobar conectividad de red
4. Consultar documentación de proveedores

¡ElGuanteWeb está listo para producción! 🎉
