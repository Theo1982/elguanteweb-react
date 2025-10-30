// src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserLevel } from '../utils/getUserLevel';

export default function Profile() {
  const { user } = useAuth();
  const [puntos, setPuntos] = useState(0);
  const [nivel, setNivel] = useState({ nivel: 'Sin nivel', descuento: 0 });

  useEffect(() => {
    const fetchPuntos = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'puntos'),
          where('usuario', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        let total = 0;
        snapshot.forEach(doc => {
          total += doc.data().valor || 0;
        });

        setPuntos(total);
        setNivel(getUserLevel(total));
      } catch (error) {
        console.error('❌ Error obteniendo puntos:', error);
      }
    };

    fetchPuntos();
  }, [user]);

  if (!user) {
    return (
      <p style={{ padding: '20px' }}>
        ⚠️ Debes iniciar sesión para ver tu perfil.
      </p>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>👤 Perfil de Usuario</h1>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <h2>⭐ Puntos acumulados: {puntos}</h2>
      <h3>
        🏆 Nivel: {nivel.nivel}
        {nivel.descuento > 0 && ` (Descuento ${nivel.descuento}%)`}
      </h3>
    </div>
  );
}
