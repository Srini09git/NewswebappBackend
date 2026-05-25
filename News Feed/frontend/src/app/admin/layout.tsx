"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { LogOut, LayoutDashboard, PlusCircle, Users, User } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("admin_token");
    if (!token && !pathname.includes("/admin/login")) {
      router.push("/admin/login");
    } else if (token) {
      setIsAuthenticated(true);
      try {
        const decoded: any = jwtDecode(token);
        setRole(decoded.role || "admin");
      } catch (e) {
        console.error("Invalid token");
      }
    }
    setLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    Cookies.remove("admin_token");
    setIsAuthenticated(false);
    router.push("/admin/login");
  };

  if (loading) return null;

  if (pathname.includes("/admin/login")) {
    return <div className="notranslate h-full">{children}</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 notranslate">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              Admin Panel
            </Link>
            
            <div className="hidden sm:flex items-center gap-1 ml-4">
              <Link 
                href="/admin/dashboard" 
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === '/admin/dashboard' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Dashboard
              </Link>
              <Link 
                href="/admin/posts/new" 
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname.includes('/new') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <PlusCircle className="w-4 h-4 inline mr-2" />
                Create Post
              </Link>
              {role === "super_admin" && (
                <Link 
                  href="/admin/users" 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname.includes('/users') ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Manage Admins
                </Link>
              )}
              <Link 
                href="/admin/profile" 
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === '/admin/profile' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">
              View Site
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-red-500 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-2 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
