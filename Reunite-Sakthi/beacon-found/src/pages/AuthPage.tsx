import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Shield } from "lucide-react";
import { type LoginData, type RegisterData } from "../services/authService";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "user" | "admin";

const DEFAULT_ADMIN_EMAIL = "admin@reunite.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });

  const navigate = useNavigate();
  const { login, register } = useAuth();

  const isAdminMode = authMode === "admin";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError("");

    if (mode === "admin") {
      setIsLogin(true);
      setFormData((current) => ({
        ...current,
        name: "",
        phone: "",
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      email: current.email === DEFAULT_ADMIN_EMAIL ? "" : current.email,
      password: current.password === DEFAULT_ADMIN_PASSWORD ? "" : current.password
    }));
  };

  const fillAdminCredentials = () => {
    setFormData((current) => ({
      ...current,
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const loginData: LoginData = {
          email: formData.email,
          password: formData.password
        };
        await login(loginData.email, loginData.password);
        const isAdminLogin = formData.email.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL;
        navigate(isAdminLogin ? "/admin" : "/dashboard");
      } else {
        const registerData: RegisterData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined
        };
        await register(registerData.name, registerData.email, registerData.password, registerData.phone);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-foreground"
              style={{
                width: `${Math.random() * 200 + 50}px`,
                height: `${Math.random() * 200 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="w-20 h-20 rounded-3xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              {isAdminMode ? (
                <Shield className="w-10 h-10 text-primary-foreground" />
              ) : (
                <Heart className="w-10 h-10 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-4xl font-semibold text-primary-foreground tracking-tight">
              {isAdminMode ? "Admin access to Reunite." : "Bringing it back home."}
            </h1>
            <p className="text-primary-foreground/70 mt-4 text-lg max-w-md mx-auto">
              {isAdminMode
                ? "Use the default admin account to manage users, payments, commissions, and platform activity."
                : "The world is full of honest people. Join our community and help reunite lost items with their owners."}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              {isAdminMode ? <Shield className="w-5 h-5 text-primary-foreground" /> : <Heart className="w-5 h-5 text-primary-foreground" />}
            </div>
            <span className="text-xl font-semibold text-foreground">Reunite</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => switchMode("user")}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                authMode === "user"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              User Access
            </button>
            <button
              type="button"
              onClick={() => switchMode("admin")}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                authMode === "admin"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              Admin Login
            </button>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">
            {isAdminMode ? "Admin login" : isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-muted-foreground mt-1.5">
            {isAdminMode
              ? "Use the default admin email and password to continue"
              : isLogin
                ? "Sign in to continue to Reunite"
                : "Join the community and start reconnecting"}
          </p>

          {/* {isAdminMode && (
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
              <p className="text-sm font-medium text-foreground">Default admin credentials</p>
              <p className="text-sm text-muted-foreground mt-1">Email: {DEFAULT_ADMIN_EMAIL}</p>
              <p className="text-sm text-muted-foreground">Password: {DEFAULT_ADMIN_PASSWORD}</p>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                Use default admin login
              </button>
            </div>
          )} */}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {!isLogin && !isAdminMode && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Jordan Rivera"
                      required={!isLogin}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                
              </>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={isAdminMode ? DEFAULT_ADMIN_EMAIL : "jordan@example.com"}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isAdminMode ? DEFAULT_ADMIN_PASSWORD : "Enter your password"}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAdminMode || isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>
                  {isAdminMode ? "Login as Admin" : isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!isAdminMode && (
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
