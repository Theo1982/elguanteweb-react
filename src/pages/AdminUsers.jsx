// src/pages/AdminUsers.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import './Admin.css';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signup } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    role: 'usuario',
  });
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // Verificar role
  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile || profile.role !== 'admin') {
      navigate('/login');
    }
  }, [user, profile, authLoading, navigate]);

  // 🔄 Cargar todos los usuarios
  const fetchUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(usersData);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // 🔄 Cambiar rol
  const cambiarRol = async (id, nuevoRol) => {
    try {
      const ref = doc(db, 'usuarios', id);
      await updateDoc(ref, { role: nuevoRol });
      alert(`✅ Rol actualizado a ${nuevoRol}`);
      fetchUsuarios(); // refrescar lista
    } catch (error) {
      console.error('❌ Error cambiando rol:', error);
      alert('Error al cambiar el rol');
    }
  };

  // 🗑️ Eliminar usuario
  const eliminarUsuario = async id => {
    if (!window.confirm('⚠️ ¿Seguro que deseas eliminar este usuario?')) return;

    try {
      const ref = doc(db, 'usuarios', id);
      await deleteDoc(ref);
      alert('🗑️ Usuario eliminado con éxito');
      fetchUsuarios(); // refrescar lista
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      alert('Error al eliminar el usuario');
    }
  };

  // ➕ Crear nuevo usuario
  const handleCreateChange = e => {
    setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password)
      return;

    setCreandoUsuario(true);
    try {
      // Use AuthContext signup to create user with Firebase Auth and Firestore document
      await signup(
        nuevoUsuario.email,
        nuevoUsuario.password,
        nuevoUsuario.nombre
      );

      alert('✅ Usuario creado con éxito');
      setNuevoUsuario({ nombre: '', email: '', password: '', role: 'usuario' });
      fetchUsuarios(); // refrescar lista
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      alert('Error al crear el usuario: ' + error.message);
    } finally {
      setCreandoUsuario(false);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>⏳ Cargando usuarios...</p>;

  return (
    <div className="admin-container">
      <h1>👥 Gestión de Usuarios</h1>
      <p>Aquí el administrador puede gestionar los usuarios.</p>

      <form onSubmit={handleCreate} className="admin-form">
        <input
          name="nombre"
          placeholder="Nombre"
          value={nuevoUsuario.nombre}
          onChange={handleCreateChange}
          required
          className="admin-input"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={nuevoUsuario.email}
          onChange={handleCreateChange}
          required
          className="admin-input"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          value={nuevoUsuario.password}
          onChange={handleCreateChange}
          required
          className="admin-input"
        />
        <select
          name="role"
          value={nuevoUsuario.role}
          onChange={handleCreateChange}
          className="admin-input"
        >
          <option value="usuario">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" disabled={creandoUsuario} className="btn-submit">
          {creandoUsuario ? 'Creando...' : '➕ Crear Usuario'}
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr className="admin-table-header">
            <th className="admin-th">UID</th>
            <th className="admin-th">Nombre</th>
            <th className="admin-th">Email</th>
            <th className="admin-th">Rol</th>
            <th className="admin-th">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td className="admin-td">{u.id}</td>
              <td className="admin-td">{u.nombre}</td>
              <td className="admin-td">{u.email}</td>
              <td className="admin-td">{u.role}</td>
              <td className="admin-td">
                {u.role !== 'admin' && (
                  <button
                    onClick={() => cambiarRol(u.id, 'admin')}
                    className="btn-edit"
                  >
                    🔑 Hacer Admin
                  </button>
                )}
                {u.role !== 'usuario' && (
                  <button
                    onClick={() => cambiarRol(u.id, 'usuario')}
                    className="btn-secondary"
                  >
                    👤 Hacer Usuario
                  </button>
                )}
                <button
                  onClick={() => eliminarUsuario(u.id)}
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
