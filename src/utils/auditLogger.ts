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

export interface AuditLog {
  uid: string;
  name: string;
  email: string;
  action: string;
  status: "SUCCESS" | "WARNING" | "ERROR";
  message: string;
  attempts: number;
  timestamp: any;
}

export const logEvent = async ({
  user,
  action,
  status,
  message
}: {
  user: any;
  action: string;
  status: "SUCCESS" | "WARNING" | "ERROR";
  message: string;
}) => {
  if (!user) return;

  try {
    // 1. Fetch last attempt count for this specific action and user
    const q = query(
      collection(db, "auditLogs"),
      where("uid", "==", user.uid),
      where("action", "==", action),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    let attempts = 1;

    if (!querySnapshot.empty) {
      const lastLog = querySnapshot.docs[0].data() as AuditLog;
      // Reset attempts if the last one was successful, otherwise increment
      attempts = lastLog.status === "SUCCESS" ? 1 : (lastLog.attempts || 0) + 1;
    }

    // 2. Check if user should be blocked (threshold: 5 failed attempts)
    if (attempts >= 5 && status === "WARNING") {
      status = "ERROR";
      message = "User blocked due to repeated unauthorized access attempts";
      
      // Update user status in Firestore
      try {
        await updateDoc(doc(db, "users", user.uid), {
          status: "Blocked"
        });
      } catch (err) {
        console.error("Failed to block user:", err);
      }
    }

    // 3. Log the event
    await addDoc(collection(db, "auditLogs"), {
      uid: user.uid,
      name: user.displayName || "Unknown",
      email: user.email,
      action,
      status,
      message,
      attempts,
      timestamp: serverTimestamp()
    });

  } catch (err) {
    console.error("Logging failed:", err);
  }
};
