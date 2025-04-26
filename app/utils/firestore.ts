// utils/firestore.ts
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../config/private-config/config/firebaseConfig';

export const incrementCustomerOrder = async (customerId: string) =>
  updateDoc(doc(db, 'customers', customerId), {
    totalOrders: increment(1),
  });
