
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

export default function RoleProtectedRoute({
  permission,
  adminOnly = false,
}) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      setChecking(true);
      setAllowed(false);

      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(
          doc(db, "users", user.uid)
        );

        if (!profileSnapshot.exists()) {
          if (mounted) setChecking(false);
          return;
        }

        const profile = profileSnapshot.data();

        if (profile.status !== "active") {
          if (mounted) setChecking(false);
          return;
        }

        const roleName = String(profile.role || "")
          .trim()
          .toLowerCase();

        // Admin has full application access.
        if (roleName === "admin") {
          if (mounted) setAllowed(true);
          return;
        }

        // Admin-only routes are unavailable to other roles.
        if (adminOnly) {
          if (mounted) setAllowed(false);
          return;
        }

        let roleData = null;

        // Preferred: retrieve the assigned role using its document ID.
        if (profile.roleId) {
          const roleSnapshot = await getDoc(
            doc(db, "roles", profile.roleId)
          );

          if (roleSnapshot.exists()) {
            roleData = roleSnapshot.data();
          }
        } else if (roleName) {
          // Backward compatibility with existing users.
          const rolesSnapshot = await getDocs(
            collection(db, "roles")
          );

          const matchingRole = rolesSnapshot.docs.find(
            (roleDoc) =>
              String(roleDoc.data().name || "")
                .trim()
                .toLowerCase() === roleName
          );

          if (matchingRole) {
            roleData = matchingRole.data();
          }
        }

        if (!roleData || roleData.status !== "active") {
          if (mounted) setAllowed(false);
          return;
        }

        const userPermissions = Array.isArray(roleData.permissions)
          ? roleData.permissions
          : [];

        if (mounted) {
          setAllowed(
            Boolean(permission && userPermissions.includes(permission))
          );
        }
      } catch (error) {
        console.error("Permission verification failed:", error);
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [permission, adminOnly]);

  if (checking) {
    return (
      <div className="auth-loading">
        Checking your access...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}
