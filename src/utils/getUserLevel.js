// src/utils/getUserLevel.js
import { collection, getDocs, where, query } from 'firebase/firestore';
import { db } from '../firebase';

// 👉 Calcular puntos válidos (últimos 60 días) y determinar nivel
export async function getUserLevel(usuarioId) {
  const q = query(collection(db, 'puntos'), where('usuario', '==', usuarioId));
  const snapshot = await getDocs(q);

  const ahora = new Date();
  const puntosValidos = snapshot.docs
    .map(doc => doc.data())
    .filter(p => {
      const fecha = p.fecha.toDate();
      const diff = (ahora - fecha) / (1000 * 60 * 60 * 24); // diferencia en días
      return diff <= 60; // ✅ solo últimos 60 días
    })
    .reduce((acc, p) => acc + p.valor, 0);

  let nivel = 'Sin nivel';
  let descuento = 0;

  if (puntosValidos >= 100) {
    nivel = 'Oro';
    descuento = 15;
  } else if (puntosValidos >= 50) {
    nivel = 'Plata';
    descuento = 10;
  } else if (puntosValidos >= 25) {
    nivel = 'Bronce';
    descuento = 5;
  }

  return { puntos: puntosValidos, nivel, descuento };
}
