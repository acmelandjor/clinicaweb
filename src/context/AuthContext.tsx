"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    User
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle, LogOut } from "lucide-react";

interface UserData {
    nombre: string;
    autorizado: boolean;
    acupuntura: boolean;
    tuina: boolean;
    pro: boolean;
    fecha_registro: any;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissionDenied, setPermissionDenied] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                if (firebaseUser.email) {
                    try {
                        const docRef = doc(db, "usuario", firebaseUser.email);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const data = docSnap.data() as UserData;
                            if (data.autorizado) {
                                setUser(firebaseUser);
                                setUserData(data);
                                setPermissionDenied(null);
                            } else {
                                setUser(firebaseUser); // Authenticated but not authorized
                                setPermissionDenied("Tu cuenta aún no ha sido autorizada por el administrador.");
                            }
                        } else {
                            // Si el usuario no existe, lo creamos como no autorizado
                            const newUserData = {
                                nombre: firebaseUser.displayName || "Usuario",
                                autorizado: false,
                                acupuntura: false,
                                tuina: false,
                                pro: false,
                                fecha_registro: serverTimestamp()
                            };
                            await setDoc(docRef, newUserData);
                            setUser(firebaseUser);
                            setPermissionDenied("Tu cuenta ha sido registrada y está pendiente de autorización.");
                        }
                    } catch (err) {
                        console.error("Error fetching user data:", err);
                        setPermissionDenied("Error al verificar permisos de usuario.");
                    }
                } else {
                    setPermissionDenied("No se pudo obtener el email del usuario.");
                }
            } else {
                setUser(null);
                setUserData(null);
                setPermissionDenied(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!loading && !user && pathname !== "/login") {
            router.push("/login");
        }
    }, [user, loading, pathname, router]);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/");
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserData(null);
            setPermissionDenied(null);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>;
    }

    if (permissionDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-red-100">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
                    <p className="text-gray-600 mb-8">{permissionDenied}</p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm text-gray-500">
                        Cuenta: <span className="font-medium text-gray-700">{user?.email}</span>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900 transition-colors"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión e Intentar con otra cuenta
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
