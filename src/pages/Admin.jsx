// src/pages/Admin.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./Admin.css";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function Admin() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
    imagen: "",
    stock: "",
    categoria: "",
    descripcion: "",
  });
  const [editandoId, setEditandoId] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Verificar role
  useEffect(() => {
    if (loading) return;
    if (!user || !profile || profile.role !== "admin") {
      navigate("/login");
    }
  }, [user, profile, loading, navigate]);

  // Cargar productos
  const fetchProductos = async () => {
    setCargandoProductos(true);
    try {
      const q = await getDocs(collection(db, "productos"));
      let items = q.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Remove duplicates based on nombre (assuming product names are unique)
      items = items.filter((item, index, self) =>
        index === self.findIndex(t => t.nombre === item.nombre)
      );

      items.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProductos(items);
    } catch (err) {
      console.error("Error fetching productos:", err);
    } finally {
      setCargandoProductos(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleChange = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nuevoProducto.nombre || !nuevoProducto.precio) return;

    await addDoc(collection(db, "productos"), {
      nombre: nuevoProducto.nombre,
      precio: Number(nuevoProducto.precio),
      imagen: nuevoProducto.imagen || "",
      stock: Number(nuevoProducto.stock) || 0,
      categoria: nuevoProducto.categoria || "",
      descripcion: nuevoProducto.descripcion || "",
    });

    setNuevoProducto({ nombre: "", precio: "", imagen: "", stock: "", categoria: "", descripcion: "" });
    fetchProductos();
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editandoId) return;

    const ref = doc(db, "productos", editandoId);
    await updateDoc(ref, {
      nombre: nuevoProducto.nombre,
      precio: Number(nuevoProducto.precio),
      imagen: nuevoProducto.imagen || "",
      stock: Number(nuevoProducto.stock) || 0,
      categoria: nuevoProducto.categoria || "",
      descripcion: nuevoProducto.descripcion || "",
    });

    setNuevoProducto({ nombre: "", precio: "", imagen: "", stock: "", categoria: "", descripcion: "" });
    setEditandoId(null);
    fetchProductos();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar producto?")) return;
    await deleteDoc(doc(db, "productos", id));
    fetchProductos();
  };

  if (loading || cargandoProductos) {
    return <p style={{ padding: 20 }}>⏳ Cargando...</p>;
  }

  return (
    <div className="admin-container">
      <h1>⚙️ Panel de Administración</h1>
      <p>Aquí el administrador puede gestionar los productos.</p>

      <form onSubmit={editandoId ? handleEdit : handleAdd} className="admin-form">
        <input name="nombre" placeholder="Nombre" value={nuevoProducto.nombre} onChange={handleChange} required className="admin-input" />
        <input name="precio" placeholder="Precio" value={nuevoProducto.precio} onChange={handleChange} required className="admin-input" />
        <input name="stock" placeholder="Stock" value={nuevoProducto.stock} onChange={handleChange} className="admin-input" />
        <input name="categoria" placeholder="Categoria" value={nuevoProducto.categoria} onChange={handleChange} className="admin-input" />
        <input name="imagen" placeholder="URL imagen" value={nuevoProducto.imagen} onChange={handleChange} className="admin-input" />
        <input name="descripcion" placeholder="Descripcion" value={nuevoProducto.descripcion} onChange={handleChange} className="admin-input" />
        <button type="submit" className="btn-submit">
          {editandoId ? "Actualizar producto" : "Agregar producto"}
        </button>
        {editandoId && (
          <button type="button" onClick={() => { setEditandoId(null); setNuevoProducto({ nombre: "", precio: "", imagen: "", stock: "", categoria: "", descripcion: "" }); }} className="btn-cancel">
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
          {productos.map((p) => (
            <tr key={p.id}>
              <td className="admin-td">{p.nombre}</td>
              <td className="admin-td">${p.precio}</td>
              <td className="admin-td">{p.stock}</td>
              <td className="admin-td">{p.categoria || "—"}</td>
              <td className="admin-td">{p.imagen ? <img src={p.imagen} alt={p.nombre} className="admin-img" /> : "Sin imagen"}</td>
              <td className="admin-td">
                <button onClick={() => { setEditandoId(p.id); setNuevoProducto({ nombre: p.nombre, precio: p.precio, imagen: p.imagen || "", stock: p.stock || 0, categoria: p.categoria || "", descripcion: p.descripcion || "" }); }} className="btn-edit">
                  ✏️ Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="btn-delete">
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

