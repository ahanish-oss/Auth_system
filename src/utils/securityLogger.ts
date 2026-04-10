import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export async function getSecurityInsights() {
  try {
    const logsRef = collection(db, 'auditLogs');
    const querySnapshot = await getDocs(logsRef);
    
    const logs = querySnapshot.docs.map(doc => doc.data());
    
    const totalAttempts = logs.length;
    const failedAttempts = logs.filter(log => log.status === 'WARNING' || log.status === 'ERROR').length;
    const successfulAttempts = logs.filter(log => log.status === 'SUCCESS').length;
    
    const failedByEmail: Record<string, number> = {};
    logs.filter(log => log.status === 'WARNING' || log.status === 'ERROR').forEach(log => {
      failedByEmail[log.email] = (failedByEmail[log.email] || 0) + 1;
    });
    
    const topAttackerEntry = Object.entries(failedByEmail)
      .sort((a, b) => b[1] - a[1])[0];
      
    const topAttacker = topAttackerEntry ? {
      email: topAttackerEntry[0],
      failedCount: topAttackerEntry[1]
    } : null;

    return {
      totalAttempts,
      failedAttempts,
      successfulAttempts,
      topAttacker
    };
  } catch (error) {
    console.error("Error fetching security insights:", error);
    return {
      totalAttempts: 0,
      failedAttempts: 0,
      successfulAttempts: 0,
      topAttacker: null
    };
  }
}
