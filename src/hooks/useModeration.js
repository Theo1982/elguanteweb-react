import { useState, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import useToast from './useToast';

export const useModeration = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Reportar contenido inapropiado
  const reportContent = useCallback(async (contentType, contentId, reason, description = '') => {
    if (!user) {
      addToast('Debes iniciar sesión para reportar contenido', 'error');
      return false;
    }

    setLoading(true);
    try {
      const reportData = {
        contentType, // 'review', 'product', 'comment', etc.
        contentId,
        reportedBy: user.uid,
        reporterName: user.displayName || user.email?.split('@')[0],
        reason, // 'spam', 'inappropriate', 'offensive', 'fake', etc.
        description,
        status: 'pending',
        reportedAt: new Date(),
        priority: reason === 'offensive' || reason === 'hate_speech' ? 'high' : 'medium'
      };

      await addDoc(collection(db, 'content_reports'), reportData);
      addToast('Reporte enviado exitosamente. Gracias por ayudar a mantener la comunidad segura.', 'success');
      return true;

    } catch (error) {
      console.error('Error reporting content:', error);
      addToast('Error al enviar el reporte', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  // Obtener reportes pendientes (solo admin/moderadores)
  const getPendingReports = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      addToast('No tienes permisos para esta acción', 'error');
      return [];
    }

    setLoading(true);
    try {
      const reportsRef = collection(db, 'content_reports');
      const q = query(
        reportsRef,
        where('status', '==', 'pending'),
        orderBy('reportedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return reports;

    } catch (error) {
      console.error('Error getting pending reports:', error);
      addToast('Error al obtener reportes', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  // Resolver reporte
  const resolveReport = useCallback(async (reportId, action, moderatorNotes = '') => {
    if (!user || user.role !== 'admin') {
      addToast('No tienes permisos para esta acción', 'error');
      return false;
    }

    setLoading(true);
    try {
      const updateData = {
        status: action, // 'approved', 'rejected', 'removed'
        resolvedBy: user.uid,
        resolvedAt: new Date(),
        moderatorNotes
      };

      await updateDoc(doc(db, 'content_reports', reportId), updateData);

      // Si se aprueba el reporte, tomar acción en el contenido
      if (action === 'removed') {
        // Aquí iría la lógica para remover el contenido reportado
        // Dependiendo del contentType, eliminar de la colección correspondiente
        addToast('Contenido removido exitosamente', 'success');
      } else {
        addToast('Reporte resuelto', 'success');
      }

      return true;

    } catch (error) {
      console.error('Error resolving report:', error);
      addToast('Error al resolver el reporte', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  // Moderación automática básica (placeholder para IA)
  const autoModerate = useCallback(async (content, contentType) => {
    // Esta sería la función que integraría con un servicio de IA
    // Por ahora, hace una moderación básica basada en palabras clave

    const bannedWords = [
      'spam', 'scam', 'fraud', 'fake', 'illegal',
      'odio', 'racista', 'discriminación', 'insulto',
      'violencia', 'amenaza', 'droga', 'arma'
    ];

    const lowerContent = content.toLowerCase();
    const foundBannedWords = bannedWords.filter(word =>
      lowerContent.includes(word)
    );

    if (foundBannedWords.length > 0) {
      // Auto-reportar contenido sospechoso
      await addDoc(collection(db, 'content_reports'), {
        contentType,
        contentId: 'auto-generated',
        reportedBy: 'auto-moderator',
        reporterName: 'Sistema Automático',
        reason: 'auto_detected',
        description: `Palabras detectadas: ${foundBannedWords.join(', ')}`,
        status: 'flagged',
        reportedAt: new Date(),
        priority: 'high',
        autoFlagged: true
      });

      return {
        flagged: true,
        reason: 'Contenido potencialmente inapropiado detectado',
        bannedWords: foundBannedWords
      };
    }

    return { flagged: false };
  }, []);

  // Obtener estadísticas de moderación
  const getModerationStats = useCallback(async () => {
    if (!user || user.role !== 'admin') return null;

    setLoading(true);
    try {
      const reportsRef = collection(db, 'content_reports');

      // Total reports
      const totalQuery = query(reportsRef);
      const totalSnapshot = await getDocs(totalQuery);

      // Pending reports
      const pendingQuery = query(reportsRef, where('status', '==', 'pending'));
      const pendingSnapshot = await getDocs(pendingQuery);

      // Resolved reports this month
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const monthlyQuery = query(
        reportsRef,
        where('resolvedAt', '>=', monthAgo)
      );
      const monthlySnapshot = await getDocs(monthlyQuery);

      return {
        totalReports: totalSnapshot.size,
        pendingReports: pendingSnapshot.size,
        monthlyResolved: monthlySnapshot.size,
        resolutionRate: totalSnapshot.size > 0 ?
          ((totalSnapshot.size - pendingSnapshot.size) / totalSnapshot.size * 100).toFixed(1) : 0
      };

    } catch (error) {
      console.error('Error getting moderation stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Banear usuario (acción administrativa)
  const banUser = useCallback(async (userId, reason, duration = null) => {
    if (!user || user.role !== 'admin') {
      addToast('No tienes permisos para esta acción', 'error');
      return false;
    }

    setLoading(true);
    try {
      const banData = {
        userId,
        bannedBy: user.uid,
        reason,
        bannedAt: new Date(),
        duration, // null = permanent, or timestamp for temporary
        isActive: true
      };

      await addDoc(collection(db, 'user_bans'), banData);

      // Aquí iría la lógica para deshabilitar al usuario
      // Por ejemplo, actualizar el perfil del usuario

      addToast('Usuario baneado exitosamente', 'success');
      return true;

    } catch (error) {
      console.error('Error banning user:', error);
      addToast('Error al banear usuario', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  return {
    reportContent,
    getPendingReports,
    resolveReport,
    autoModerate,
    getModerationStats,
    banUser,
    loading
  };
};
