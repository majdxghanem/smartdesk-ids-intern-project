import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
    FaCheckCircle,
    FaClock,
    FaEye,
    FaEyeSlash,
    FaLock,
    FaShieldAlt,
    FaUser
} from "react-icons/fa";
import api from "../services/api";
import "../styles/login.css";

function Login() {

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

const [email, setEmail] = useState("");

const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false);

const [error, setError] = useState("");

    if (localStorage.getItem("token") && localStorage.getItem("user")) {
        return <Navigate to="/dashboard" replace />;
    }

const handleLogin = async (event) => {

    event?.preventDefault();

    setLoading(true);

    setError("");

    try {

        const response = await api.post("/login", {

           email: email,

            password: password

        });

        localStorage.setItem("token", response.data.token);

        localStorage.setItem("user", JSON.stringify(response.data.user));

        navigate("/dashboard");

    }

    catch (err) {

        if (err.response) {

            setError(err.response.data.message);

        }

        else {

            setError("Server connection failed.");

        }

    }

    finally {

        setLoading(false);

    }

};

    return (

        <div className="login-container">
            <div className="login-orb login-orb-one" />
            <div className="login-orb login-orb-two" />

            <main className="login-shell">
                <section className="login-intro">
                    <div className="login-brand">
                        <img
                            className="login-brand-mark"
                            src="/smartdesk-logo.svg"
                            alt="SmartDesk"
                        />
                        <div>
                            <strong>SmartDesk</strong>
                            <small>IT service workspace</small>
                        </div>
                    </div>

                    <div className="login-intro-copy">
                        <span className="login-eyebrow">Support, simplified</span>
                        <h1>Resolve work faster with one clear service desk.</h1>
                        <p>
                            Keep requests, conversations, assignments, and activity
                            organized in a secure shared workspace.
                        </p>
                    </div>

                    <div className="login-benefits">
                        <span><FaCheckCircle /> Clear ticket ownership</span>
                        <span><FaClock /> Complete activity history</span>
                        <span><FaShieldAlt /> Role-based access</span>
                    </div>
                </section>

                <section className="login-form-panel">
                    <div className="login-form-heading">
                        <span className="login-form-kicker">Welcome back</span>
                        <h2>Sign in to your account</h2>
                        <p>Use your SmartDesk credentials to continue.</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        {searchParams.get("session") === "expired" && (
                            <div className="login-notice">Your session expired. Please sign in again.</div>
                        )}
                        <label>
                            <span>Email address</span>
                            <div className="login-input-wrap">
                                <FaUser />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </label>

                        <label>
                            <span>Password</span>
                            <div className="login-input-wrap">
                                <FaLock />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </label>

                        <Link className="login-forgot-link" to="/forgot-password">
                            Forgot your password?
                        </Link>

                        {error && <div className="login-error">{error}</div>}

                        <button className="login-submit" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="login-help">Protected access for authorized SmartDesk users.</p>
                </section>
            </main>
        </div>

    );

}

export default Login;
