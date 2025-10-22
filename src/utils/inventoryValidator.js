// src/utils/inventoryValidator.js
import { logger } from './logger.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';

// Validaciones de inventario en tiempo real
export class InventoryValidator {
  constructor(db) {
    this.db = db;
    this.logger = logger.createValidationLogger();
  }

  // Validar stock antes de una operación
  async validateStock(productId, requestedQuantity, operation = 'unknown') {
    try {
      const productRef = doc(collection(this.db, 'productos'), productId);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        const error = new Error(`Producto ${productId} no encontrado`);
        this.logger.invalidData('productId', productId, 'Producto no existe', {
          operation,
          requestedQuantity,
        });
        throw error;
      }

      const productData = productDoc.data();
      const currentStock = productData.stock || 0;

      // Validar stock disponible
      if (currentStock < requestedQuantity) {
        const error = new Error(
          `Stock insuficiente para ${productData.nombre}. Disponible: ${currentStock}, Solicitado: ${requestedQuantity}`
        );
        this.logger.invalidData('stock', currentStock, 'Stock insuficiente', {
          operation,
          productId,
          productName: productData.nombre,
          currentStock,
          requestedQuantity,
        });
        throw error;
      }

      // Validar stock bajo (advertencia)
      if (currentStock <= 5 && currentStock > 0) {
        logger.warn(`Stock bajo para ${productData.nombre}`, {
          productId,
          productName: productData.nombre,
          currentStock,
          type: 'low_stock_warning',
        });
      }

      // Validar stock cero
      if (currentStock === 0) {
        const error = new Error(`Producto ${productData.nombre} sin stock`);
        this.logger.invalidData('stock', currentStock, 'Producto sin stock', {
          operation,
          productId,
          productName: productData.nombre,
        });
        throw error;
      }

      return {
        valid: true,
        productData,
        currentStock,
      };
    } catch (error) {
      logger.error(`Error validando stock para producto ${productId}`, {
        operation,
        productId,
        requestedQuantity,
        error: error.message,
      });
      throw error;
    }
  }

  // Validar múltiples productos en lote
  async validateBatchStock(items, operation = 'batch_operation') {
    const results = {
      valid: [],
      invalid: [],
      warnings: [],
    };

    logger.info(`Validando stock para ${items.length} productos`, {
      operation,
      itemCount: items.length,
    });

    for (const item of items) {
      try {
        const validation = await this.validateStock(
          item.productId,
          item.quantity,
          operation
        );

        if (validation.currentStock <= 5 && validation.currentStock > 0) {
          results.warnings.push({
            productId: item.productId,
            productName: validation.productData.nombre,
            currentStock: validation.currentStock,
            message: 'Stock bajo',
          });
        }

        results.valid.push({
          ...item,
          productData: validation.productData,
          currentStock: validation.currentStock,
        });
      } catch (error) {
        results.invalid.push({
          ...item,
          error: error.message,
        });
      }
    }

    // Logging del resumen
    this.logger.validationSummary(
      results.valid.length,
      results.invalid.length,
      {
        operation,
        warnings: results.warnings.length,
      }
    );

    if (results.warnings.length > 0) {
      logger.warn(`${results.warnings.length} productos con stock bajo`, {
        operation,
        warnings: results.warnings,
      });
    }

    return results;
  }

  // Actualizar stock después de una operación
  async updateStock(productId, quantityChange, operation = 'stock_update') {
    try {
      const productRef = doc(collection(this.db, 'productos'), productId);

      return await runTransaction(this.db, async transaction => {
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Producto ${productId} no encontrado`);
        }

        const currentData = productDoc.data();
        const newStock = (currentData.stock || 0) + quantityChange;

        // Validar que el stock no sea negativo
        if (newStock < 0) {
          throw new Error(
            `No se puede reducir el stock por debajo de 0 para ${currentData.nombre}`
          );
        }

        transaction.update(productRef, {
          stock: newStock,
          fechaActualizacion: new Date(),
        });

        logger.info(`Stock actualizado para ${currentData.nombre}`, {
          operation,
          productId,
          productName: currentData.nombre,
          previousStock: currentData.stock,
          newStock,
          quantityChange,
        });

        return {
          productId,
          productName: currentData.nombre,
          previousStock: currentData.stock,
          newStock,
          quantityChange,
        };
      });
    } catch (error) {
      logger.error(`Error actualizando stock para producto ${productId}`, {
        operation,
        productId,
        quantityChange,
        error: error.message,
      });
      throw error;
    }
  }

  // Obtener resumen de inventario
  async getInventorySummary() {
    try {
      const productsRef = collection(this.db, 'productos');
      const snapshot = await getDocs(productsRef);

      let totalProducts = 0;
      let totalValue = 0;
      let lowStockProducts = [];
      let outOfStockProducts = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        totalProducts++;

        const stock = data.stock || 0;
        const precio = data.precio || 0;
        totalValue += stock * precio;

        if (stock === 0) {
          outOfStockProducts.push({
            id: docSnap.id,
            nombre: data.nombre,
            precio: precio,
          });
        } else if (stock <= 5) {
          lowStockProducts.push({
            id: docSnap.id,
            nombre: data.nombre,
            stock: stock,
            precio: precio,
          });
        }
      });

      const summary = {
        totalProducts,
        totalValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        lowStockProducts,
        outOfStockProducts,
      };

      logger.info('Resumen de inventario generado', {
        totalProducts,
        totalValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      });

      return summary;
    } catch (error) {
      logger.error('Error generando resumen de inventario', {
        error: error.message,
      });
      throw error;
    }
  }

  // Validar integridad de datos de producto
  validateProductData(productData) {
    const errors = [];

    // Validar campos requeridos
    if (
      !productData.nombre ||
      typeof productData.nombre !== 'string' ||
      productData.nombre.trim().length === 0
    ) {
      errors.push('Nombre requerido');
    }

    if (
      !productData.precio ||
      isNaN(productData.precio) ||
      productData.precio <= 0
    ) {
      errors.push('Precio inválido');
    }

    if (
      productData.stock === undefined ||
      isNaN(productData.stock) ||
      productData.stock < 0
    ) {
      errors.push('Stock inválido');
    }

    if (
      !productData.categoria ||
      typeof productData.categoria !== 'string' ||
      productData.categoria.trim().length === 0
    ) {
      errors.push('Categoría requerida');
    }

    // Log de errores de validación
    if (errors.length > 0) {
      this.logger.invalidData(
        'productData',
        productData.nombre || 'unknown',
        errors.join(', '),
        {
          productData,
        }
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Función helper para crear validador
export function createInventoryValidator(db) {
  return new InventoryValidator(db);
}

export default InventoryValidator;
