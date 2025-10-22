import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { validatePrice, validateStock } from '../utils/validators';
import './Admin.css';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from 'firebase/firestore';

export default function Admin() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    imagen: '',
    stock: '',
    categoria: '',
    descripcion: '',
  });
  const [editandoId, setEditandoId] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Verificar role
  useEffect(() => {
    if (loading) return;
    if (!user || !profile || profile.role !== 'admin') {
      navigate('/login');
    }
  }, [user, profile, loading, navigate]);

  // Cargar productos real-time
  useEffect(() => {
    setCargandoProductos(true);
    const q = query(collection(db, 'productos'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Remove duplicates based on nombre (assuming product names are unique)
        items = items.filter(
          (item, index, self) =>
            index === self.findIndex(t => t.nombre === item.nombre)
        );

        items.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setProductos(items);
        setCargandoProductos(false);
      },
      err => {
        console.error('Error fetching productos:', err);
        setCargandoProductos(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter products based on search
  useEffect(() => {
    const filtered = productos.filter(p =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProductos(filtered);
  }, [productos, searchTerm]);

  const handleChange = e => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const handleAdd = async e => {
    e.preventDefault();
    if (!nuevoProducto.nombre || !nuevoProducto.precio) return;

    const precioNum = Number(nuevoProducto.precio);
    const stockNum = Number(nuevoProducto.stock) || 0;

    // Validation
    const priceValidation = validatePrice(precioNum);
    if (!priceValidation.isValid) {
      alert(
        priceValidation.message ||
          'Precio debe ser un número positivo mayor a 0'
      );
      return;
    }
    const stockValidation = validateStock(stockNum);
    if (!stockValidation.isValid) {
      alert(stockValidation.message || 'Stock debe ser un número no negativo');
      return;
    }

    await addDoc(collection(db, 'productos'), {
      nombre: nuevoProducto.nombre,
      precio: precioNum,
      imagen: nuevoProducto.imagen || '',
      stock: stockNum,
      categoria: nuevoProducto.categoria || '',
      descripcion: nuevoProducto.descripcion || '',
    });

    setNuevoProducto({
      nombre: '',
      precio: '',
      imagen: '',
      stock: '',
      categoria: '',
      descripcion: '',
    });
  };

  const handleEdit = async e => {
    e.preventDefault();
    if (!editandoId) return;

    const precioNum = Number(nuevoProducto.precio);
    const stockNum = Number(nuevoProducto.stock) || 0;

    // Validation
    const priceValidation = validatePrice(precioNum);
    if (!priceValidation.isValid) {
      alert(
        priceValidation.message ||
          'Precio debe ser un número positivo mayor a 0'
      );
      return;
    }
    const stockValidation = validateStock(stockNum);
    if (!stockValidation.isValid) {
      alert(stockValidation.message || 'Stock debe ser un número no negativo');
      return;
    }

    const ref = doc(db, 'productos', editandoId);
    await updateDoc(ref, {
      nombre: nuevoProducto.nombre,
      precio: precioNum,
      imagen: nuevoProducto.imagen || '',
      stock: stockNum,
      categoria: nuevoProducto.categoria || '',
      descripcion: nuevoProducto.descripcion || '',
    });

    setNuevoProducto({
      nombre: '',
      precio: '',
      imagen: '',
      stock: '',
      categoria: '',
      descripcion: '',
    });
    setEditandoId(null);
  };

  const handleDelete = async id => {
    if (!confirm('¿Eliminar producto?')) return;
    await deleteDoc(doc(db, 'productos', id));
  };

  if (loading || cargandoProductos) {
    return <p style={{ padding: 20 }}>⏳ Cargando...</p>;
  }

  return (
    <div className="admin-container">
      <h1>⚙️ Panel de Administración</h1>
      <p>Aquí el administrador puede gestionar los productos.</p>

      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar productos por nombre..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <form
        onSubmit={editandoId ? handleEdit : handleAdd}
        className="admin-form"
      >
        <input
          name="nombre"
          placeholder="Nombre"
          value={nuevoProducto.nombre}
          onChange={handleChange}
          required
          className="admin-input"
        />
        <input
          name="precio"
          placeholder="Precio"
          value={nuevoProducto.precio}
          onChange={handleChange}
          required
          className="admin-input"
        />
        <input
          name="stock"
          placeholder="Stock"
          value={nuevoProducto.stock}
          onChange={handleChange}
          className="admin-input"
        />
        <input
          name="categoria"
          placeholder="Categoria"
          value={nuevoProducto.categoria}
          onChange={handleChange}
          className="admin-input"
        />
        <input
          name="imagen"
          placeholder="URL imagen"
          value={nuevoProducto.imagen}
          onChange={handleChange}
          className="admin-input"
        />
        <input
          name="descripcion"
          placeholder="Descripcion"
          value={nuevoProducto.descripcion}
          onChange={handleChange}
          className="admin-input"
        />
        <button type="submit" className="btn-submit">
          {editandoId ? 'Actualizar producto' : 'Agregar producto'}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={() => {
              setEditandoId(null);
              setNuevoProducto({
                nombre: '',
                precio: '',
                imagen: '',
                stock: '',
                categoria: '',
                descripcion: '',
              });
            }}
            className="btn-cancel"
          >
            Cancelar
          </button>
        )}
      </form>

      <table className="admin-table">
        <thead>
          <tr className="admin-table-header">
            <th className="admin-th">Nombre</th>
            <th className="admin-th">Precio</th>
            <th className="admin-th">Stock</th>
            <th className="admin-th">Categoria</th>
            <th className="admin-th">Imagen</th>
            <th className="admin-th">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProductos.map(p => (
            <tr key={p.id}>
              <td className="admin-td">{p.nombre}</td>
              <td className="admin-td">${p.precio}</td>
              <td className="admin-td">{p.stock}</td>
              <td className="admin-td">{p.categoria || '—'}</td>
              <td className="admin-td">
                {p.imagen ? (
                  <img src={p.imagen} alt={p.nombre} className="admin-img" />
                ) : (
                  'Sin imagen'
                )}
              </td>
              <td className="admin-td">
                <button
                  onClick={() => {
                    setEditandoId(p.id);
                    setNuevoProducto({
                      nombre: p.nombre,
                      precio: p.precio,
                      imagen: p.imagen || '',
                      stock: p.stock || 0,
                      categoria: p.categoria || '',
                      descripcion: p.descripcion || '',
                    });
                  }}
                  className="btn-edit"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="btn-delete"
                >
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
