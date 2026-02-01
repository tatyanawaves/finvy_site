import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserReceipts, 
  saveReceipt, 
  deleteReceipt, 
  checkDuplicate 
} from '../services/firestoreService';
import { ReceiptData, FirestoreReceipt } from '../types';

interface UseReceiptsReturn {
  receipts: FirestoreReceipt[];
  loading: boolean;
  error: string | null;
  addReceipt: (receipt: ReceiptData) => Promise<{ success: boolean; error?: string }>;
  removeReceipt: (receiptId: string) => Promise<void>;
  refreshReceipts: () => Promise<void>;
  totalSpent: number;
  categoryStats: Record<string, number>;
  typeStats: Record<string, number>;
}

export const useReceipts = (): UseReceiptsReturn => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<FirestoreReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReceipts = useCallback(async () => {
    if (!user) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userReceipts = await getUserReceipts(user.uid);
      setReceipts(userReceipts);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError('Ошибка загрузки чеков');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshReceipts();
  }, [refreshReceipts]);

  const addReceipt = async (receipt: ReceiptData): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Пользователь не авторизован' };
    }

    try {
      const isDuplicate = await checkDuplicate(
        user.uid,
        receipt.merchant,
        receipt.date,
        receipt.total_spent
      );

      if (isDuplicate) {
        return { success: false, error: 'Этот чек уже был добавлен ранее' };
      }

      const docId = await saveReceipt(user.uid, receipt);
      
      const newReceipt: FirestoreReceipt = {
        ...receipt,
        id: docId,
        userId: user.uid,
        createdAt: new Date()
      };
      
      setReceipts(prev => [newReceipt, ...prev]);
      
      return { success: true };
    } catch (err: any) {
      console.error('Error saving receipt:', err);
      return { success: false, error: 'Ошибка сохранения чека' };
    }
  };

  const removeReceipt = async (receiptId: string): Promise<void> => {
    try {
      await deleteReceipt(receiptId);
      setReceipts(prev => prev.filter(r => r.id !== receiptId));
    } catch (err: any) {
      console.error('Error deleting receipt:', err);
      throw new Error('Ошибка удаления чека');
    }
  };

  // Вычисляемые значения
  const totalSpent = receipts.reduce((sum, r) => sum + r.total_spent, 0);

  const categoryStats: Record<string, number> = {};
  const typeStats: Record<string, number> = {};

  receipts.forEach(receipt => {
    receipt.items_aggregated.forEach(item => {
      const category = item.category || 'Другое';
      categoryStats[category] = (categoryStats[category] || 0) + item.total_price;
      typeStats[item.type] = (typeStats[item.type] || 0) + item.total_price;
    });
  });

  return {
    receipts,
    loading,
    error,
    addReceipt,
    removeReceipt,
    refreshReceipts,
    totalSpent,
    categoryStats,
    typeStats
  };
};
