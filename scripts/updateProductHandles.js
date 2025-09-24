// scripts/updateProductHandles.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mapeo de nombres de productos a handles
const productHandleMap = {
  "JABON LIQUIDO ROPA": "jabon-liquido-ropa",
  "DETERGENTE OXIGEL": "detergente-oxigel",
  "DESODORANTE PISO": "desodorante-piso",
  "SUAVIZANTE ORIGINAL": "suavizante-original"
};

// Función para crear handle a partir del nombre
function createHandle(nombre) {
  return nombre
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .trim();
}

async function updateProductHandles() {
  try {
    console.log("🔍 Obteniendo productos de Firestore...");

    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);

    console.log(`📊 Encontrados ${snapshot.size} productos`);

    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const nombre = data.nombre;

      // Primero intentar con el mapeo exacto
      let handle = productHandleMap[nombre];

      // Si no está en el mapeo, crear handle automáticamente
      if (!handle) {
        handle = createHandle(nombre);
      }

      // Solo actualizar si no tiene handle o si es diferente
      if (!data.handle || data.handle !== handle) {
        const docRef = doc.ref;
        batch.update(docRef, { handle });
        updateCount++;
        console.log(`📝 Actualizando: ${nombre} -> handle: ${handle}`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Actualizados ${updateCount} productos con handles`);
    } else {
      console.log("ℹ️  No hay productos que necesiten actualización de handle");
    }

  } catch (error) {
    console.error("❌ Error actualizando handles:", error);
  }
}

// Ejecutar el script
updateProductHandles().then(() => {
  console.log("🏁 Script completado.");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Error en el script:", error);
  process.exit(1);
});
