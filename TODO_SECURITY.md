# TODO_SECURITY.md: Guía de Seguridad para ElGuanteWeb

## Reglas de Firestore (Actualizar en Firebase Console)
Usa estas rules para restringir acceso:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Productos: Read público, write solo admin
    match /productos/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Reseñas: Read público, write authenticated
    match /reseñas/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.adminReview == false;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      // Admin can moderate
      allow update: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Usuarios: Solo owner
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Carrito/Favoritos: Solo owner
    match /carritos/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default: Auth required
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Storage Rules (Firebase Storage)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Product images: Public read, admin write
    match /productos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // User avatars: Owner read/write
    match /usuarios/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default: Auth required
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Validación Client-Side
- Usa `validators.js` en todos forms (nombre, precio, stock, email).
- Sanitiza inputs con DOMPurify si agregas (npm i dompurify).
- Rate limiting en backend para login/pagos.

## CSP (Content Security Policy)
En index.html ya agregado:
```
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:;">
```
- Para prod, usa headers en server (Express helmet middleware).

## Autenticación
- Firebase Auth con email verification, password reset.
- Roles en profile doc (admin/user).
- ProtectedRoute verifica role.

## Backend Security (server.js)
- CORS restrictivo (origins: localhost, domain).
- Rate limit ya en express-rate-limit.
- Validate MercadoPago webhooks con signature.
- No expose env vars.

## Otras Best Practices
- Env vars en .env (no commit).
- No hardcode API keys.
- Error handling: No leak stack traces in prod.
- HTTPS only in prod.
- OWASP Top 10: Sanitize, validate, auth.

Estado: Implementado básico; monitor con Firebase Monitoring.
