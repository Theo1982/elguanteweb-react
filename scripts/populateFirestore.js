// scripts/populateFirestore.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, getDocs, doc, addDoc, updateDoc } from "firebase/firestore";
import fs from "fs";
import dotenv from "dotenv";
import { logger } from "../src/utils/logger.js";
import { createInventoryValidator } from "../src/utils/inventoryValidator.js";

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: Variable de entorno faltante: ${envVar}`);
    console.error('Asegúrate de configurar tu archivo .env con las credenciales de Firebase');
    process.exit(1);
  }
}

// Configuración de Firebase usando variables de entorno
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

// Función para validar datos de producto
function validarProducto(producto) {
  const errores = [];

  if (!producto.nombre || typeof producto.nombre !== 'string' || producto.nombre.trim().length === 0) {
    errores.push('Nombre inválido o faltante');
  }

  if (!producto.precio || isNaN(producto.precio) || producto.precio <= 0) {
    errores.push('Precio inválido o faltante');
  }

  if (producto.stock === undefined || isNaN(producto.stock) || producto.stock < 0) {
    errores.push('Stock inválido');
  }

  if (!producto.categoria || typeof producto.categoria !== 'string' || producto.categoria.trim().length === 0) {
    errores.push('Categoría inválida o faltante');
  }

  return errores;
}

// Función para leer y validar productos desde el archivo JSON
function cargarProductos() {
  try {
    console.log("📂 Leyendo archivo de productos...");
    const productosJson = JSON.parse(fs.readFileSync('./src/data/productos.json', 'utf8'));

    console.log("🔍 Validando y mapeando productos...");
    const productosValidos = [];
    const productosInvalidos = [];

    productosJson.forEach((p, index) => {
      const producto = {
        nombre: p.Nombre?.trim(),
        precio: parseFloat(p['Precio [El Guante]']),
        stock: parseFloat(p['En inventario [El Guante]']) || 0,
        categoria: p.Categoria?.trim(),
        imagen: p.imagen?.trim() || '',
        descripcion: p.Descripción?.trim() || '',
        handle: p.Handle?.trim() || '',
        fechaCreacion: new Date(),
        activo: true
      };

      const errores = validarProducto(producto);
      if (errores.length === 0) {
        productosValidos.push(producto);
      } else {
        productosInvalidos.push({ index, producto: p, errores });
        console.warn(`⚠️  Producto ${index + 1} inválido: ${errores.join(', ')}`);
      }
    });

    console.log(`✅ ${productosValidos.length} productos válidos`);
    if (productosInvalidos.length > 0) {
      console.warn(`⚠️  ${productosInvalidos.length} productos inválidos (serán omitidos)`);
    }

    return productosValidos;
  } catch (error) {
    console.error("❌ Error cargando productos:", error.message);
    throw error;
  }
}

const productosEjemplo = cargarProductos();

// Función para agregar productos usando batch operations
async function agregarProductosBatch(productos, batchSize = 500) {
  const batches = [];
  const totalProductos = productos.length;

  console.log(`📦 Procesando ${totalProductos} productos en lotes de ${batchSize}...`);

  for (let i = 0; i < totalProductos; i += batchSize) {
    const batchProductos = productos.slice(i, i + batchSize);
    batches.push(batchProductos);
  }

  console.log(`🔄 Se crearán ${batches.length} lotes`);

  let productosAgregados = 0;
  let loteActual = 1;

  for (const batchProductos of batches) {
    const batch = writeBatch(db);
    const loteIds = [];

    console.log(`📝 Preparando lote ${loteActual}/${batches.length} (${batchProductos.length} productos)...`);

    batchProductos.forEach((producto) => {
      const docRef = doc(collection(db, "productos"));
      batch.set(docRef, producto);
      loteIds.push(docRef.id);
    });

    try {
      await batch.commit();
      productosAgregados += batchProductos.length;
      console.log(`✅ Lote ${loteActual}/${batches.length} completado (${productosAgregados}/${totalProductos} productos)`);

      // Mostrar algunos productos del lote
      batchProductos.slice(0, 3).forEach((producto, index) => {
        console.log(`   ${index + 1}. ${producto.nombre} - $${producto.precio}`);
      });
      if (batchProductos.length > 3) {
        console.log(`   ... y ${batchProductos.length - 3} productos más`);
      }

    } catch (error) {
      console.error(`❌ Error en lote ${loteActual}:`, error.message);
      // Intentar reintentar el lote individualmente
      console.log("🔄 Reintentando productos del lote individualmente...");
      await agregarProductosIndividualmente(batchProductos);
    }

    loteActual++;
  }

  return productosAgregados;
}

// Función fallback para agregar productos individualmente con retry
async function agregarProductosIndividualmente(productos, maxRetries = 3) {
  let exitosos = 0;
  let fallidos = 0;

  for (const producto of productos) {
    let retryCount = 0;
    let success = false;

    while (retryCount < maxRetries && !success) {
      try {
        const docRef = await addDoc(collection(db, "productos"), producto);
        console.log(`✅ Producto agregado: ${producto.nombre} (ID: ${docRef.id})`);
        exitosos++;
        success = true;
      } catch (error) {
        retryCount++;
        console.warn(`⚠️  Reintento ${retryCount}/${maxRetries} para ${producto.nombre}: ${error.message}`);

        if (retryCount < maxRetries) {
          // Esperar antes del siguiente reintento (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        } else {
          console.error(`❌ Falló definitivamente: ${producto.nombre}`);
          fallidos++;
        }
      }
    }
  }

  return { exitosos, fallidos };
}

async function poblarFirestore() {
  const startTime = Date.now();
  const dbLogger = logger.createDatabaseLogger('populate_firestore');
  const inventoryValidator = createInventoryValidator(db);

  dbLogger.start({
    totalProducts: productosEjemplo.length,
    operation: 'bulk_import'
  });

  try {
    console.log("🔥 Iniciando población de Firestore...");
    console.log(`📊 Total de productos a procesar: ${productosEjemplo.length}`);

    // Obtener productos existentes para actualizar en lugar de duplicar
    const productosExistentesSnapshot = await getDocs(collection(db, "productos"));
    const productosExistentes = {};
    productosExistentesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.handle) {
        productosExistentes[data.handle] = { id: doc.id, data };
      }
    });

    console.log(`📋 Encontrados ${Object.keys(productosExistentes).length} productos existentes en Firestore.`);

    // Validar productos antes de procesar
    console.log("🔍 Validando productos con el sistema de inventario...");
    const productosValidados = [];
    const productosInvalidos = [];

    for (const producto of productosEjemplo) {
      const validation = inventoryValidator.validateProductData(producto);
      if (validation.isValid) {
        productosValidados.push(producto);
      } else {
        productosInvalidos.push({
          producto,
          errores: validation.errors
        });
      }
    }

    console.log(`✅ ${productosValidados.length} productos válidos para procesar`);
    if (productosInvalidos.length > 0) {
      console.log(`⚠️  ${productosInvalidos.length} productos inválidos serán omitidos`);
      logger.warn(`${productosInvalidos.length} productos inválidos omitidos`, {
        invalidCount: productosInvalidos.length,
        operation: 'data_validation'
      });
    }

    // Procesar productos: actualizar existentes o agregar nuevos
    let productosActualizados = 0;
    let productosAgregados = 0;

    for (const producto of productosValidados) {
      if (productosExistentes[producto.handle]) {
        // Actualizar producto existente
        const existing = productosExistentes[producto.handle];
        await updateDoc(doc(db, 'productos', existing.id), producto);
        productosActualizados++;
        console.log(`🔄 Actualizado: ${producto.nombre}`);
      } else {
        // Agregar nuevo producto
        await addDoc(collection(db, 'productos'), producto);
        productosAgregados++;
        console.log(`➕ Agregado: ${producto.nombre}`);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n🎉 ¡Proceso completado!");
    console.log(`📦 Productos agregados: ${productosAgregados}`);
    console.log(`🔄 Productos actualizados: ${productosActualizados}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);

    // Mostrar resumen final
    const totalProductos = await getDocs(collection(db, "productos"));
    console.log(`📊 Total de productos en la base de datos: ${totalProductos.size}`);

    // Generar resumen de inventario
    const inventorySummary = await inventoryValidator.getInventorySummary();
    console.log("\n📈 Resumen de Inventario:");
    console.log(`   • Total productos: ${inventorySummary.totalProducts}`);
    console.log(`   • Valor total inventario: $${inventorySummary.totalValue.toFixed(2)}`);
    console.log(`   • Productos con stock bajo: ${inventorySummary.lowStockCount}`);
    console.log(`   • Productos sin stock: ${inventorySummary.outOfStockCount}`);

    dbLogger.success({
      productosAgregados,
      productosActualizados,
      productosInvalidos: productosInvalidos.length,
      tiempoTotal: duration,
      resumenInventario: inventorySummary
    });

  } catch (error) {
    dbLogger.error(error, {
      totalProducts: productosEjemplo.length,
      tiempoTranscurrido: ((Date.now() - startTime) / 1000).toFixed(2)
    });

    console.error("❌ Error general poblando Firestore:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Ejecutar el script
poblarFirestore().then(() => {
  console.log("🏁 Script completado.");
  process.exit(0);
});
