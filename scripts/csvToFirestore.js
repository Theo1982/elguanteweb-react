import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import fs from "fs";
import csv from "csv-parser";
import dotenv from "dotenv";
import { logger } from "../src/utils/logger.js";
import { createInventoryValidator } from "../src/utils/inventoryValidator.js";

// Cargar variables de entorno
dotenv.config();

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

// Función para leer y procesar el archivo CSV
function procesarCSV() {
  return new Promise((resolve, reject) => {
    const productos = [];
    const productosInvalidos = [];

    console.log("📂 Leyendo archivo CSV de productos...");

    fs.createReadStream('./productos.csv')
      .pipe(csv({
        separator: ',',
        mapHeaders: ({ header }) => header.trim()
      }))
      .on('data', (row) => {
        try {
          // Mapear campos del CSV a la estructura de productos
          const producto = {
            nombre: row['Nombre']?.trim(),
            precio: parseFloat(row['Precio [El Guante]']) || 0,
            stock: parseFloat(row['En inventario [El Guante]']) || 0,
            categoria: row['Categoria']?.trim(),
            descripcion: row['Descripción']?.trim() || '',
            imagen: '', // Se puede agregar lógica para mapear imágenes
            handle: row['Handle']?.trim(),
            ref: row['REF']?.trim(),
            fechaCreacion: new Date(),
            activo: true
          };

          // Validar producto
          const errores = validarProducto(producto);
          if (errores.length === 0) {
            productos.push(producto);
          } else {
            productosInvalidos.push({
              row,
              producto,
              errores
            });
            console.warn(`⚠️  Producto inválido: ${producto.nombre || 'Sin nombre'} - ${errores.join(', ')}`);
          }
        } catch (error) {
          console.error(`❌ Error procesando fila:`, error.message);
          productosInvalidos.push({
            row,
            error: error.message
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Procesamiento CSV completado:`);
        console.log(`   • ${productos.length} productos válidos`);
        console.log(`   • ${productosInvalidos.length} productos inválidos`);

        resolve({ productos, productosInvalidos });
      })
      .on('error', (error) => {
        console.error('❌ Error leyendo CSV:', error.message);
        reject(error);
      });
  });
}

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

// Función fallback para agregar productos individualmente
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

async function poblarFirestoreDesdeCSV() {
  const startTime = Date.now();
  const dbLogger = logger.createDatabaseLogger('populate_firestore_csv');
  const inventoryValidator = createInventoryValidator(db);

  dbLogger.start({
    operation: 'csv_import'
  });

  try {
    console.log("🔥 Iniciando carga de productos desde CSV...");

    // Verificar si ya existen productos
    const productosExistentes = await getDocs(collection(db, "productos"));

    if (productosExistentes.size > 0) {
      console.log(`⚠️  Ya existen ${productosExistentes.size} productos en Firestore.`);
      console.log("¿Deseas continuar y agregar más productos? (Ctrl+C para cancelar)");

      // Esperar 5 segundos para dar tiempo al usuario de cancelar
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Procesar CSV
    const { productos, productosInvalidos } = await procesarCSV();

    if (productos.length === 0) {
      console.log("❌ No se encontraron productos válidos en el CSV");
      return;
    }

    console.log(`📊 Total de productos a procesar: ${productos.length}`);

    // Validar productos con el sistema de inventario
    console.log("🔍 Validando productos con el sistema de inventario...");
    const productosValidados = [];
    const productosInvalidosValidacion = [];

    for (const producto of productos) {
      const validation = inventoryValidator.validateProductData(producto);
      if (validation.isValid) {
        productosValidados.push(producto);
      } else {
        productosInvalidosValidacion.push({
          producto,
          errores: validation.errors
        });
      }
    }

    console.log(`✅ ${productosValidados.length} productos válidos para inserción`);
    if (productosInvalidosValidacion.length > 0) {
      console.log(`⚠️  ${productosInvalidosValidacion.length} productos inválidos serán omitidos`);
      logger.warn(`${productosInvalidosValidacion.length} productos inválidos omitidos`, {
        invalidCount: productosInvalidosValidacion.length,
        operation: 'data_validation'
      });
    }

    // Agregar productos usando batch operations
    const productosAgregados = await agregarProductosBatch(productosValidados);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n🎉 ¡Proceso completado!");
    console.log(`📦 Productos agregados: ${productosAgregados}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    console.log(`🚀 Rendimiento: ${(productosAgregados / (endTime - startTime) * 1000).toFixed(2)} productos/segundo`);

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
      productosInvalidos: productosInvalidos.length + productosInvalidosValidacion.length,
      tiempoTotal: duration,
      rendimiento: parseFloat((productosAgregados / (endTime - startTime) * 1000).toFixed(2)),
      resumenInventario: inventorySummary
    });

  } catch (error) {
    dbLogger.error(error, {
      tiempoTranscurrido: ((Date.now() - startTime) / 1000).toFixed(2)
    });

    console.error("❌ Error general poblando Firestore desde CSV:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Ejecutar el script
poblarFirestoreDesdeCSV().then(() => {
  console.log("🏁 Script completado.");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
