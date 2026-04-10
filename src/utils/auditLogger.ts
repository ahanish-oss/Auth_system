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
  updateDoc,
  deleteDoc
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

    // 1. Fetch last log to see if we should increment or start new
    let attempts = 1;
    let lastLogId: string | null = null;
    
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
        const lastLogDoc = querySnapshot.docs[0];
        const lastLog = lastLogDoc.data() as AuditLog;
        
        // Check if it's "recent" (within 1 hour) to increment instead of new row
        const lastTimestamp = lastLog.timestamp?.toDate?.() || new Date(0);
        const now = new Date();
        const diffMs = now.getTime() - lastTimestamp.getTime();
        const isRecent = diffMs < 60 * 60 * 1000; // 1 hour window

        if (isRecent && lastLog.status === status) {
          lastLogId = lastLogDoc.id;
          attempts = (lastLog.attempts || 0) + 1;
        }
      }
    } catch (readErr) {
      console.warn("⚠️ Could not read previous logs:", readErr);
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

    // 3. Log the event (Update existing or Create new)
    if (lastLogId) {
      await updateDoc(doc(db, "auditLogs", lastLogId), {
        attempts,
        message,
        severity,
        status,
        timestamp: serverTimestamp()
      });
      console.log("✅ Log updated (incremented). ID:", lastLogId);
    } else {
      const logData = {
        uid: user.uid,
        name: user.displayName || user.name || "Unknown User",
        email: user.email || "no-email@system.com",
        action,
        status,
        message,
        severity,
        attempts: 1,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "auditLogs"), logData);
      console.log("✅ New log created. ID:", docRef.id);
    }

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

export const deleteAuditLog = async (logId: string) => {
  try {
    console.log("🗑️ Deleting audit log:", logId);
    await deleteDoc(doc(db, "auditLogs", logId));
    console.log("✅ Log deleted successfully");
  } catch (err) {
    console.error("❌ Failed to delete audit log:", err);
    throw err;
  }
};
