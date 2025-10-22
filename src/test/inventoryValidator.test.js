// src/test/inventoryValidator.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryValidator } from '../utils/inventoryValidator.js';

// Mock de Firestore
const mockGet = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockRunTransaction = vi.fn();
const mockUpdate = vi.fn();

const mockDb = {
  collection: mockCollection,
  runTransaction: mockRunTransaction,
};

const mockDocRef = {
  get: mockGet,
  update: mockUpdate,
};

mockCollection.mockReturnValue({
  doc: mockDoc,
});

mockDoc.mockReturnValue(mockDocRef);

describe('InventoryValidator', () => {
  let validator;

  beforeEach(() => {
    vi.clearAllMocks();
    validator = new InventoryValidator(mockDb);
  });

  describe('validateProductData', () => {
    it('should validate a correct product', () => {
      const validProduct = {
        nombre: 'Producto de Prueba',
        precio: 100,
        stock: 10,
        categoria: 'Test',
      };

      const result = validator.validateProductData(validProduct);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject product with invalid name', () => {
      const invalidProduct = {
        nombre: '',
        precio: 100,
        stock: 10,
        categoria: 'Test',
      };

      const result = validator.validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nombre requerido');
    });

    it('should reject product with invalid price', () => {
      const invalidProduct = {
        nombre: 'Producto',
        precio: -10,
        stock: 10,
        categoria: 'Test',
      };

      const result = validator.validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Precio inválido');
    });

    it('should reject product with negative stock', () => {
      const invalidProduct = {
        nombre: 'Producto',
        precio: 100,
        stock: -5,
        categoria: 'Test',
      };

      const result = validator.validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Stock inválido');
    });

    it('should reject product with invalid category', () => {
      const invalidProduct = {
        nombre: 'Producto',
        precio: 100,
        stock: 10,
        categoria: '',
      };

      const result = validator.validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Categoría requerida');
    });

    it('should handle multiple validation errors', () => {
      const invalidProduct = {
        nombre: '',
        precio: 0,
        stock: -1,
        categoria: '',
      };

      const result = validator.validateProductData(invalidProduct);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });
  });

  describe('validateStock', () => {
    it('should validate sufficient stock', async () => {
      const mockProductData = {
        nombre: 'Producto Test',
        stock: 20,
      };

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockProductData,
      });

      const result = await validator.validateStock('product123', 10);

      expect(result.valid).toBe(true);
      expect(result.productData).toEqual(mockProductData);
      expect(result.currentStock).toBe(20);
    });

    it('should reject insufficient stock', async () => {
      const mockProductData = {
        nombre: 'Producto Test',
        stock: 5,
      };

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockProductData,
      });

      await expect(validator.validateStock('product123', 10)).rejects.toThrow(
        'Stock insuficiente'
      );
    });

    it('should reject non-existent product', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      await expect(validator.validateStock('nonexistent', 1)).rejects.toThrow(
        'Producto nonexistent no encontrado'
      );
    });

    it('should reject zero stock', async () => {
      const mockProductData = {
        nombre: 'Producto Sin Stock',
        stock: 0,
      };

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockProductData,
      });

      await expect(validator.validateStock('product123', 1)).rejects.toThrow(
        'Producto Producto Sin Stock sin stock'
      );
    });
  });

  describe('updateStock', () => {
    it('should update stock successfully', async () => {
      const mockProductData = {
        nombre: 'Producto Test',
        stock: 20,
      };

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockProductData,
      });

      mockRunTransaction.mockImplementation(async callback => {
        const transaction = {
          get: mockGet,
          update: mockUpdate,
        };
        return await callback(transaction);
      });

      const result = await validator.updateStock('product123', -5);

      expect(result.productId).toBe('product123');
      expect(result.productName).toBe('Producto Test');
      expect(result.previousStock).toBe(20);
      expect(result.newStock).toBe(15);
      expect(result.quantityChange).toBe(-5);
    });

    it('should reject negative stock update', async () => {
      const mockProductData = {
        nombre: 'Producto Test',
        stock: 5,
      };

      mockGet.mockResolvedValue({
        exists: true,
        data: () => mockProductData,
      });

      mockRunTransaction.mockImplementation(async callback => {
        const transaction = {
          get: mockGet,
          update: mockUpdate,
        };
        return await callback(transaction);
      });

      await expect(validator.updateStock('product123', -10)).rejects.toThrow(
        'No se puede reducir el stock por debajo de 0'
      );
    });

    it('should reject update for non-existent product', async () => {
      mockGet.mockResolvedValue({
        exists: false,
      });

      mockRunTransaction.mockImplementation(async callback => {
        const transaction = {
          get: mockGet,
          update: mockUpdate,
        };
        return await callback(transaction);
      });

      await expect(validator.updateStock('nonexistent', 5)).rejects.toThrow(
        'Producto nonexistent no encontrado'
      );
    });
  });

  describe('validateBatchStock', () => {
    it('should validate multiple products successfully', async () => {
      const mockProductData1 = { nombre: 'Producto 1', stock: 20 };
      const mockProductData2 = { nombre: 'Producto 2', stock: 15 };

      mockGet
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockProductData1,
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockProductData2,
        });

      const items = [
        { productId: 'prod1', quantity: 5 },
        { productId: 'prod2', quantity: 10 },
      ];

      const result = await validator.validateBatchStock(items);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
      expect(result.valid[0].productData).toEqual(mockProductData1);
      expect(result.valid[1].productData).toEqual(mockProductData2);
    });

    it('should handle mixed valid and invalid products', async () => {
      const mockProductData = { nombre: 'Producto Válido', stock: 20 };

      mockGet
        .mockResolvedValueOnce({
          exists: false, // Producto no existe
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockProductData,
        });

      const items = [
        { productId: 'invalid', quantity: 5 },
        { productId: 'valid', quantity: 10 },
      ];

      const result = await validator.validateBatchStock(items);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(1);
      expect(result.valid[0].productId).toBe('valid');
      expect(result.invalid[0].productId).toBe('invalid');
    });
  });
});
