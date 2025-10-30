// src/test/normalizeData.test.js
import { describe, it, expect, vi } from 'vitest';
import {
  normalizarPrecio,
  normalizarStock,
  normalizarTexto,
  validarProductoNormalizado,
} from '../../scripts/normalizeData.js';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
}));

describe('normalizeData utilities', () => {
  describe('normalizarPrecio', () => {
    it('should convert string price to number', () => {
      expect(normalizarPrecio('$100.50')).toBe(100.5);
      expect(normalizarPrecio('  200  ')).toBe(200);
      expect(normalizarPrecio('50.99')).toBe(50.99);
    });

    it('should handle number inputs', () => {
      expect(normalizarPrecio(100)).toBe(100);
      expect(normalizarPrecio(50.5)).toBe(50.5);
    });

    it('should return 0 for invalid inputs', () => {
      expect(normalizarPrecio('')).toBe(0);
      expect(normalizarPrecio('abc')).toBe(0);
      expect(normalizarPrecio(null)).toBe(0);
      expect(normalizarPrecio(undefined)).toBe(0);
    });
  });

  describe('normalizarStock', () => {
    it('should convert string stock to number', () => {
      expect(normalizarStock('10')).toBe(10);
      expect(normalizarStock('  25  ')).toBe(25);
      expect(normalizarStock('0')).toBe(0);
    });

    it('should handle number inputs', () => {
      expect(normalizarStock(15)).toBe(15);
      expect(normalizarStock(0)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(normalizarStock('')).toBe(0);
      expect(normalizarStock('abc')).toBe(0);
      expect(normalizarStock(null)).toBe(0);
    });
  });

  describe('normalizarTexto', () => {
    it('should trim whitespace', () => {
      expect(normalizarTexto('  hello  ')).toBe('hello');
      expect(normalizarTexto('\t\ntest\t\n')).toBe('test');
    });

    it('should handle string inputs', () => {
      expect(normalizarTexto('normal text')).toBe('normal text');
      expect(normalizarTexto('')).toBe('');
    });

    it('should return empty string for non-string inputs', () => {
      expect(normalizarTexto(null)).toBe('');
      expect(normalizarTexto(undefined)).toBe('');
      expect(normalizarTexto(123)).toBe('');
      expect(normalizarTexto({})).toBe('');
    });
  });

  describe('validarProductoNormalizado', () => {
    it('should validate a correct product', () => {
      const validProduct = {
        nombre: 'Producto de Prueba',
        precio: 100,
        stock: 10,
        categoria: 'Electrónicos',
      };

      const errors = validarProductoNormalizado(validProduct);
      expect(errors).toHaveLength(0);
    });

    it('should reject product with empty name', () => {
      const invalidProduct = {
        nombre: '',
        precio: 100,
        stock: 10,
        categoria: 'Electrónicos',
      };

      const errors = validarProductoNormalizado(invalidProduct);
      expect(errors).toContain('Nombre faltante');
    });

    it('should reject product with invalid price', () => {
      const invalidProduct = {
        nombre: 'Producto',
        precio: 0,
        stock: 10,
        categoria: 'Electrónicos',
      };

      const errors = validarProductoNormalizado(invalidProduct);
      expect(errors).toContain('Precio inválido');
    });

    it('should reject product with negative stock', () => {
      const invalidProduct = {
        nombre: 'Producto',
        precio: 100,
        stock: -5,
        categoria: 'Electrónicos',
      };

      const errors = validarProductoNormalizado(invalidProduct);
      expect(errors).toContain('Stock negativo');
    });

    it('should reject product with empty category', () => {
      const invalidProduct = {
        nombre: 'Producto',
        precio: 100,
        stock: 10,
        categoria: '',
      };

      const errors = validarProductoNormalizado(invalidProduct);
      expect(errors).toContain('Categoría faltante');
    });

    it('should return multiple errors for invalid product', () => {
      const invalidProduct = {
        nombre: '',
        precio: -10,
        stock: -5,
        categoria: '',
      };

      const errors = validarProductoNormalizado(invalidProduct);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('Nombre faltante');
      expect(errors).toContain('Precio inválido');
      expect(errors).toContain('Stock negativo');
      expect(errors).toContain('Categoría faltante');
    });
  });
});

describe('Data normalization integration', () => {
  it('should handle complete product normalization workflow', () => {
    // Simular datos de entrada crudos
    const rawProduct = {
      Nombre: '  Producto de Prueba  ',
      'Precio [El Guante]': '$1,500.50',
      'En inventario [El Guante]': '  25  ',
      Categoria: 'Electrónicos',
      Descripción: 'Descripción de prueba',
      imagen: '  /img/test.jpg  ',
    };

    // Aplicar normalización
    const normalizedProduct = {
      nombre: normalizarTexto(rawProduct['Nombre']),
      precio: normalizarPrecio(rawProduct['Precio [El Guante]']),
      stock: normalizarStock(rawProduct['En inventario [El Guante]']),
      categoria: normalizarTexto(rawProduct['Categoria']),
      descripcion: normalizarTexto(rawProduct['Descripción']),
      imagen: normalizarTexto(rawProduct['imagen']),
    };

    // Verificar resultado
    expect(normalizedProduct.nombre).toBe('Producto de Prueba');
    expect(normalizedProduct.precio).toBe(1500.5);
    expect(normalizedProduct.stock).toBe(25);
    expect(normalizedProduct.categoria).toBe('Electrónicos');
    expect(normalizedProduct.descripcion).toBe('Descripción de prueba');
    expect(normalizedProduct.imagen).toBe('/img/test.jpg');

    // Validar producto normalizado
    const errors = validarProductoNormalizado(normalizedProduct);
    expect(errors).toHaveLength(0);
  });

  it('should handle edge cases in normalization', () => {
    const edgeCaseProduct = {
      Nombre: null,
      'Precio [El Guante]': '',
      'En inventario [El Guante]': 'abc',
      Categoria: undefined,
      Descripción: '   ',
      imagen: null,
    };

    const normalizedProduct = {
      nombre: normalizarTexto(edgeCaseProduct['Nombre']),
      precio: normalizarPrecio(edgeCaseProduct['Precio [El Guante]']),
      stock: normalizarStock(edgeCaseProduct['En inventario [El Guante]']),
      categoria: normalizarTexto(edgeCaseProduct['Categoria']),
      descripcion: normalizarTexto(edgeCaseProduct['Descripción']),
      imagen: normalizarTexto(edgeCaseProduct['imagen']),
    };

    expect(normalizedProduct.nombre).toBe('');
    expect(normalizedProduct.precio).toBe(0);
    expect(normalizedProduct.stock).toBe(0);
    expect(normalizedProduct.categoria).toBe('');
    expect(normalizedProduct.descripcion).toBe('');
    expect(normalizedProduct.imagen).toBe('');

    // Validar - debería tener errores
    const errors = validarProductoNormalizado(normalizedProduct);
    expect(errors.length).toBeGreaterThan(0);
  });
});
