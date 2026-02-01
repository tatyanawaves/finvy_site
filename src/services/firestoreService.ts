import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  doc,
  query, 
  where, 
  orderBy,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { ReceiptData, FirestoreReceipt } from '../types';

const RECEIPTS_COLLECTION = 'receipts';

/**
 * Сохранить чек в Firestore
 */
export const saveReceipt = async (userId: string, receipt: ReceiptData): Promise<string> => {
  const receiptData = {
    ...receipt,
    userId,
    createdAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, RECEIPTS_COLLECTION), receiptData);
  return docRef.id;
};

/**
 * Получить все чеки пользователя
 */
export const getUserReceipts = async (userId: string): Promise<FirestoreReceipt[]> => {
  const q = query(
    collection(db, RECEIPTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const receipts: FirestoreReceipt[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as DocumentData;
    receipts.push({
      id: doc.id,
      merchant: data.merchant,
      date: data.date,
      currency: data.currency,
      total_spent: data.total_spent,
      items_aggregated: data.items_aggregated,
      consumption_summary: data.consumption_summary,
      userId: data.userId,
      createdAt: data.createdAt?.toDate() || new Date()
    });
  });

  return receipts;
};

/**
 * Удалить чек
 */
export const deleteReceipt = async (receiptId: string): Promise<void> => {
  await deleteDoc(doc(db, RECEIPTS_COLLECTION, receiptId));
};

/**
 * Проверить на дубликат
 */
export const checkDuplicate = async (
  userId: string, 
  merchant: string, 
  date: string, 
  totalSpent: number
): Promise<boolean> => {
  const q = query(
    collection(db, RECEIPTS_COLLECTION),
    where('userId', '==', userId),
    where('merchant', '==', merchant),
    where('date', '==', date)
  );

  const querySnapshot = await getDocs(q);
  
  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    if (Math.abs(data.total_spent - totalSpent) < 0.01) {
      return true;
    }
  }

  return false;
};

/**
 * Получить статистику по категориям
 */
export const getCategoryStats = async (userId: string): Promise<Record<string, number>> => {
  const receipts = await getUserReceipts(userId);
  const stats: Record<string, number> = {};

  receipts.forEach(receipt => {
    receipt.items_aggregated.forEach(item => {
      const category = item.category || 'Другое';
      stats[category] = (stats[category] || 0) + item.total_price;
    });
  });

  return stats;
};
