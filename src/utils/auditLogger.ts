import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

export const ADMIN_EMAIL = "admin@gmail.com";

export interface AuditLog {
  uid: string;
  name: string;
  email: string;
  action: string;
  status: "SUCCESS" | "WARNING" | "ERROR";
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  attempts: number;
  timestamp: any;
}

export const logEvent = async ({
  user,
  action,
  status,
  message,
  severity = "LOW"
}: {
  user: any;
  action: string;
  status: "SUCCESS" | "WARNING" | "ERROR";
  message: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) => {
  if (!user) return;

  try {
    console.log("📝 Attempting to log:", action, user.email);

    // 1. Fetch last attempt count for this specific action and user
    let attempts = 1;
    try {
      const q = query(
        collection(db, "auditLogs"),
        where("uid", "==", user.uid),
        where("action", "==", action),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastLog = querySnapshot.docs[0].data() as AuditLog;
        // Reset attempts if the last one was successful, otherwise increment
        attempts = lastLog.status === "SUCCESS" ? 1 : (lastLog.attempts || 0) + 1;
      }
    } catch (readErr) {
      console.warn("⚠️ Could not read previous logs for attempt counting (likely permission restricted):", readErr);
      // Proceed with attempts = 1
    }

    // 2. Check if user should be blocked (threshold: 5 failed attempts)
    if (attempts >= 5 && (status === "WARNING" || status === "ERROR")) {
      status = "ERROR";
      severity = "CRITICAL";
      message = "User blocked due to repeated unauthorized access attempts";
      
      // Update user status in Firestore
      try {
        await updateDoc(doc(db, "users", user.uid), {
          status: "Blocked"
        });
      } catch (err) {
        console.error("❌ Failed to block user:", err);
      }
    }

    // 3. Log the event
    const logData = {
      uid: user.uid,
      name: user.displayName || user.name || "Unknown User",
      email: user.email || "no-email@system.com",
      action,
      status,
      message,
      severity,
      attempts,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "auditLogs"), logData);
    console.log("✅ Log success. ID:", docRef.id);

  } catch (err) {
    console.error("❌ Logging failed:", err);
  }
};

export const getAllAuditLogs = async (limitCount = 50) => {
  try {
    console.log("📡 Fetching all audit logs (limit:", limitCount, ")...");
    const q = query(
      collection(db, "auditLogs"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as AuditLog[];
    
    console.log("✅ Successfully fetched", logs.length, "logs");
    return logs;
  } catch (err) {
    console.error("❌ Failed to fetch audit logs:", err);
    throw err;
  }
};
