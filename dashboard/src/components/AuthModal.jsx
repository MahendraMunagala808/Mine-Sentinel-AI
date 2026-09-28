import React, { useState } from "react";

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("mineSentinelUsers") || "[]");
    let user = users.find((u) => u.email === loginEmail && u.password === loginPassword);

    if (!user) {
      user = { email: loginEmail, name: loginEmail.split("@")[0], password: loginPassword };
      users.push(user);
      localStorage.setItem("mineSentinelUsers", JSON.stringify(users));
    }

    localStorage.setItem("mineSentinelUser", JSON.stringify(user));
    onClose();
    window.location.href = "dashboard.html";
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("mineSentinelUsers") || "[]");
    const existing = users.find((u) => u.email === signupEmail);

    const newUser = { name: signupName, email: signupEmail, password: signupPassword };
    if (!existing) {
      users.push(newUser);
      localStorage.setItem("mineSentinelUsers", JSON.stringify(users));
    }

    localStorage.setItem("mineSentinelUser", JSON.stringify(newUser));
    onClose();
    window.location.href = "dashboard.html";
  };

  return (
    <div
      className="auth-overlay"
      id="authOverlay"
      style={{ display: "flex" }}
      onClick={(e) => {
        if (e.target.id === "authOverlay") onClose();
      }}
    >
      <div className="auth-card">
        {/* Close Button */}
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          <i className="ph-bold ph-x"></i>
        </button>

        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <i className="ph-fill ph-shield-check"></i>
          </div>
          <h2 className="auth-title">MineSentinel AI</h2>
          <p className="auth-subtitle">Industrial Edge IoT Safety &amp; Predictive Analytics</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => setTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* Sign In Form */}
        {tab === "login" ? (
          <form className="auth-form active" onSubmit={handleLogin}>
            <div className="auth-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="operator@minesentinel.ai"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="auth-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <i
                  className={`ph-fill ${showPassword ? "ph-eye-slash" : "ph-eye"} toggle-password`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                ></i>
              </div>
            </div>
            <button type="submit" className="auth-submit">
              Sign In to Command Center
            </button>
          </form>
        ) : (
          /* Sign Up Form */
          <form className="auth-form active" onSubmit={handleSignup}>
            <div className="auth-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Safety Officer"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
            </div>
            <div className="auth-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="officer@minesentinel.ai"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
            </div>
            <div className="auth-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <i
                  className={`ph-fill ${showPassword ? "ph-eye-slash" : "ph-eye"} toggle-password`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                ></i>
              </div>
            </div>
            <button type="submit" className="auth-submit" style={{ backgroundColor: "#2b7a78" }}>
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
