import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mercadopago from "mercadopago";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc, increment } from 'firebase/firestore';

dotenv.config();

// ✅ FIXED: Initialize Firebase Admin
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ✅ FIXED: Points system function
const awardUserPoints = async (userId, points, reason) => {
  try {
    const userPointsRef = doc(db, 'userPoints', userId);
    const userPointsDoc = await getDoc(userPointsRef);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

    if (userPointsDoc.exists()) {
      // Update existing points
      const currentData = userPointsDoc.data();
      const newPoints = (currentData.points || 0) + points;

      await updateDoc(userPointsRef, {
        points: newPoints,
        history: [...(currentData.history || []), {
          date: now.toISOString(),
          points: points,
          reason: reason
        }],
        expiresAt: expiresAt.toISOString(),
        lastUpdated: now.toISOString()
      });
    } else {
      // Create new points document
      await updateDoc(userPointsRef, {
        userId,
        points: points,
        level: 'Bronce', // Will be calculated based on points
        history: [{
          date: now.toISOString(),
          points: points,
          reason: reason
        }],
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        lastUpdated: now.toISOString()
      });
    }

    console.log(`✅ ${points} puntos otorgados a usuario ${userId}`);
  } catch (error) {
    console.error('❌ Error otorgando puntos:', error);
  }
};

const app = express();

// Middleware de seguridad
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://tu-dominio.com']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Rate limiting específico para pagos
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 intentos de pago por IP
  message: {
    error: 'Demasiados intentos de pago, intenta de nuevo más tarde.',
  },
});

const PORT = process.env.PORT || 3001;

// Validar configuración de MercadoPago
let mp = null;
const isDevelopment = process.env.NODE_ENV !== 'production';
const isTestToken = process.env.MP_ACCESS_TOKEN === 'TEST-1234567890-123456-abcdef123456789-12345678';

if (!process.env.MP_ACCESS_TOKEN) {
  if (isDevelopment) {
    console.log('⚠️ MP_ACCESS_TOKEN no configurado - ejecutando en modo demo');
  } else {
    console.error('❌ Error: MP_ACCESS_TOKEN no está configurado');
    process.exit(1);
  }
} else if (isTestToken && isDevelopment) {
  console.log('⚠️ Usando token de prueba - modo demo activado');
} else {
  // ⚡ Configuración Mercado Pago
  mp = new mercadopago.MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });
  console.log('✅ MercadoPago configurado correctamente');
}

// Middleware de validación para crear preferencia
const validatePreferenceData = (req, res, next) => {
  const { items, usuarioId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Items requeridos',
      details: 'Debe proporcionar al menos un item'
    });
  }

  if (!usuarioId) {
    return res.status(400).json({
      error: 'Usuario ID requerido',
      details: 'Debe proporcionar un ID de usuario válido'
    });
  }

  // Validar cada item
  for (const item of items) {
    if (!item.title || !item.unit_price || !item.quantity) {
      return res.status(400).json({
        error: 'Datos de item inválidos',
        details: 'Cada item debe tener title, unit_price y quantity'
      });
    }

    if (Number(item.unit_price) <= 0 || Number(item.quantity) <= 0) {
      return res.status(400).json({
        error: 'Valores inválidos',
        details: 'El precio y cantidad deben ser mayores a 0'
      });
    }
  }

  next();
};

// Middleware de logging
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};

app.use(logRequest);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 👉 Crear preferencia de pago
app.post("/create_preference", paymentLimiter, validatePreferenceData, async (req, res) => {
  try {
    const { items, usuarioId, metadata = {} } = req.body;

    // Calcular total para validación
    const total = items.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);

    if (total > 999999) { // Límite de MercadoPago
      return res.status(400).json({
        error: 'Monto excede el límite permitido',
        details: 'El total no puede exceder $999,999'
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : 'http://localhost:5173';

    // Modo demo - sin MercadoPago real
    if (!mp || isTestToken) {
      console.log(`🎭 Modo demo - Simulando preferencia - Usuario: ${usuarioId} - Total: $${total}`);

      const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return res.json({
        id: demoId,
        init_point: `${baseUrl}/success?payment_id=${demoId}&status=approved&points=${Math.floor(total/100)}&level=Bronce`,
        sandbox_init_point: `${baseUrl}/success?payment_id=${demoId}&status=approved&points=${Math.floor(total/100)}&level=Bronce`,
        demo: true
      });
    }

    const preference = {
      items: items.map((item) => ({
        title: String(item.title).substring(0, 256), // Límite de MercadoPago
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        currency_id: "ARS",
      })),
      back_urls: {
        success: `${baseUrl}/success`,
        failure: `${baseUrl}/failure`,
        pending: `${baseUrl}/pending`,
      },
      auto_return: "approved",
      metadata: {
        usuarioId,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    };

    const result = await new mercadopago.Preference(mp).create({ body: preference });

    // Log de la transacción
    console.log(`✅ Preferencia creada: ${result.id} - Usuario: ${usuarioId} - Total: $${total}`);

    res.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Error en create_preference:", error);

    // No exponer detalles internos en producción
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : error.message;

    res.status(500).json({
      error: "Error creando preferencia de pago",
      details: errorMessage,
    });
  }
});

// 👉 Consultar pago por ID
app.get("/payment/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea numérico
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: 'ID de pago inválido',
        details: 'El ID debe ser numérico'
      });
    }

    const result = await new mercadopago.Payment(mp).get({ id });

    // Log de la consulta
    console.log(`📋 Consulta de pago: ${id} - Estado: ${result.status}`);

    res.json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      transaction_amount: result.transaction_amount,
      currency_id: result.currency_id,
      date_created: result.date_created,
      date_approved: result.date_approved,
      metadata: result.metadata
    });
  } catch (error) {
    console.error("❌ Error al obtener pago:", error);

    if (error.status === 404) {
      return res.status(404).json({
        error: "Pago no encontrado",
        details: "El ID de pago proporcionado no existe"
      });
    }

    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Error consultando pago'
      : error.message;

    res.status(500).json({
      error: "Error consultando pago",
      details: errorMessage,
    });
  }
});

// 👉 Verificar pago (nuevo endpoint)
app.get("/verify-payment/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        error: 'Payment ID requerido',
        details: 'Debe proporcionar un ID de pago válido'
      });
    }

    // Modo demo
    if (!mp || isTestToken) {
      console.log(`🎭 Modo demo - Verificando pago: ${paymentId}`);
      return res.json({
        verified: true,
        status: 'approved',
        paymentId,
        demo: true
      });
    }

    // Verificar pago real con MercadoPago
    const payment = await new mercadopago.Payment(mp).get({ id: paymentId });

    console.log(`✅ Pago verificado: ${paymentId} - Estado: ${payment.status}`);

    res.json({
      verified: payment.status === 'approved',
      status: payment.status,
      paymentId,
      transactionAmount: payment.transaction_amount,
      dateApproved: payment.date_approved
    });
  } catch (error) {
    console.error("❌ Error verificando pago:", error);

    if (error.status === 404) {
      return res.status(404).json({
        verified: false,
        error: "Pago no encontrado",
        paymentId: req.params.paymentId
      });
    }

    res.status(500).json({
      verified: false,
      error: "Error verificando pago",
      details: process.env.NODE_ENV === 'production' ? 'Error interno' : error.message
    });
  }
});

// 👉 Webhook de MercadoPago (para notificaciones)
app.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`🔔 Webhook recibido - Pago: ${paymentId}`);

      // ✅ FIXED: Get payment details and update order status
      if (mp) {
        const payment = await new mercadopago.Payment(mp).get({ id: paymentId });

        if (payment.status === 'approved') {
          // Find order by payment ID in metadata
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('paymentId', '==', paymentId));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0];
            const orderData = orderDoc.data();

            // Update order status to completed
            await updateDoc(orderDoc.ref, {
              status: 'completed',
              paymentDetails: {
                paymentId,
                status: payment.status,
                transactionAmount: payment.transaction_amount,
                dateApproved: payment.date_approved
              }
            });

            // ✅ Reduce inventory for each item
            for (const item of orderData.items) {
              const productRef = doc(db, 'productos', item.id);
              const productDoc = await getDoc(productRef);

              if (productDoc.exists()) {
                const currentStock = productDoc.data().stock || 0;
                await updateDoc(productRef, {
                  stock: Math.max(0, currentStock - item.quantity)
                });
              }
            }

            // ✅ Award points to user
            const pointsEarned = orderData.pointsEarned || Math.floor(orderData.total / 1000);
            await awardUserPoints(orderData.userId, pointsEarned, `Compra #${orderDoc.id}`);

            console.log(`✅ Orden ${orderDoc.id} completada - Inventario reducido - Puntos otorgados`);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).send('Error');
  }
});

// 👉 Webhook de MercadoPago con validación de firma (SEGURIDAD)
app.post("/webhook/secure", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // ✅ FIXED: Validate MercadoPago webhook signature
    const signature = req.headers['x-signature'];
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.log('⚠️ Webhook sin firma o secreto no configurado');
      return res.status(401).send('Unauthorized');
    }

    // Verify signature (simplified - MercadoPago uses HMAC-SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    if (signature !== `sha256=${expectedSignature}`) {
      console.log('❌ Firma de webhook inválida');
      return res.status(401).send('Invalid signature');
    }

    const { type, data } = JSON.parse(req.body);

    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`🔔 Webhook seguro recibido - Pago: ${paymentId}`);

      // ✅ FIXED: Get payment details and update order status
      if (mp) {
        const payment = await new mercadopago.Payment(mp).get({ id: paymentId });

        if (payment.status === 'approved') {
          // Find order by payment ID in metadata
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('paymentId', '==', paymentId));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0];
            const orderData = orderDoc.data();

            // Update order status to completed
            await updateDoc(orderDoc.ref, {
              status: 'completed',
              paymentDetails: {
                paymentId,
                status: payment.status,
                transactionAmount: payment.transaction_amount,
                dateApproved: payment.date_approved
              }
            });

            // ✅ Reduce inventory for each item
            for (const item of orderData.items) {
              const productRef = doc(db, 'productos', item.id);
              const productDoc = await getDoc(productRef);

              if (productDoc.exists()) {
                const currentStock = productDoc.data().stock || 0;
                await updateDoc(productRef, {
                  stock: Math.max(0, currentStock - item.quantity)
                });
              }
            }

            // ✅ Award points to user
            const pointsEarned = orderData.pointsEarned || Math.floor(orderData.total / 1000);
            await awardUserPoints(orderData.userId, pointsEarned, `Compra #${orderDoc.id}`);

            console.log(`✅ Orden ${orderDoc.id} completada - Inventario reducido - Puntos otorgados`);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en webhook seguro:', error);
    res.status(500).send('Error');
  }
});

// 👉 Enviar mensaje de WhatsApp
app.post("/send-whatsapp", async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos',
        details: 'Se requieren "to" y "message"'
      });
    }

    const whatsappService = await import('./whatsappService.js');
    const result = await whatsappService.default.sendMessage(to, message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        status: result.status
      });
    } else {
      res.status(500).json({
        error: 'Error enviando mensaje de WhatsApp',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error en send-whatsapp:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('❌ Error no manejado:', error);

  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : error.message;

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
