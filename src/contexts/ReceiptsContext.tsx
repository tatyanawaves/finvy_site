import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserReceipts,
  saveReceipt,
  deleteReceipt,
  checkDuplicate,
} from '../services/firestoreService';
import { ReceiptData, FirestoreReceipt } from '../types';

interface ReceiptsContextValue {
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

const ReceiptsContext = createContext<ReceiptsContextValue | null>(null);

export const ReceiptsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  const addReceipt = useCallback(async (receipt: ReceiptData): Promise<{ success: boolean; error?: string }> => {
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
        createdAt: new Date(),
      };

      setReceipts((prev) => [newReceipt, ...prev]);

      return { success: true };
    } catch (err: any) {
      console.error('Error saving receipt:', err);
      return { success: false, error: 'Ошибка сохранения чека' };
    }
  }, [user]);

  const removeReceipt = useCallback(async (receiptId: string): Promise<void> => {
    try {
      await deleteReceipt(receiptId);
      setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    } catch (err: any) {
      console.error('Error deleting receipt:', err);
      throw new Error('Ошибка удаления чека');
    }
  }, []);

  // Мемоизированные вычисляемые значения
  const { totalSpent, categoryStats, typeStats } = useMemo(() => {
    const total = receipts.reduce((sum, r) => sum + r.total_spent, 0);
    const cats: Record<string, number> = {};
    const types: Record<string, number> = {};

    receipts.forEach((receipt) => {
      receipt.items_aggregated.forEach((item) => {
        const category = item.category || 'Другое';
        cats[category] = (cats[category] || 0) + item.total_price;
        types[item.type] = (types[item.type] || 0) + item.total_price;
      });
    });

    return { totalSpent: total, categoryStats: cats, typeStats: types };
  }, [receipts]);

  const value = useMemo(() => ({
    receipts,
    loading,
    error,
    addReceipt,
    removeReceipt,
    refreshReceipts,
    totalSpent,
    categoryStats,
    typeStats,
  }), [receipts, loading, error, addReceipt, removeReceipt, refreshReceipts, totalSpent, categoryStats, typeStats]);

  return (
    <ReceiptsContext.Provider value={value}>
      {children}
    </ReceiptsContext.Provider>
  );
};

export const useReceipts = (): ReceiptsContextValue => {
  const context = useContext(ReceiptsContext);
  if (!context) {
    throw new Error('useReceipts must be used within a ReceiptsProvider');
  }
  return context;
};
