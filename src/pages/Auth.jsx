import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../lib/firebase";

function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLogin = mode === "login";

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
      } else {
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        setSuccess("Account created successfully.");
      }
    } catch (error) {
      console.error("Firebase authentication error:", error);

      let message = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/user-not-found":
        case "auth/invalid-credential":
          message = "Incorrect email or password.";
          break;

        case "auth/wrong-password":
          message = "Incorrect email or password.";
          break;

        case "auth/email-already-in-use":
          message = "An account with this email already exists.";
          break;

        case "auth/weak-password":
          message = "Password must be at least 6 characters.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many attempts. Please wait a while and try again.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection.";
          break;

        default:
          message = error.message || message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isLogin ? "signup" : "login");
    setError("");
    setSuccess("");
    setPassword("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef7f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "22px",
          padding: "32px",
          boxSizing: "border-box",
          boxShadow: "0 15px 45px rgba(15, 159, 154, 0.12)",
          border: "1px solid #dbe7e7",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "17px",
              background: "#0f9f9a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: "23px",
              fontWeight: 800,
            }}
          >
            VG
          </div>

          <h1
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "27px",
              fontWeight: 800,
            }}
          >
            VGlytics
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Track Smart. Spend Smarter.
          </p>
        </div>

        <h2
          style={{
            margin: "0 0 6px",
            color: "#111827",
            fontSize: "21px",
          }}
        >
          {isLogin ? "Welcome back" : "Create your account"}
        </h2>

        <p
          style={{
            margin: "0 0 22px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          {isLogin
            ? "Sign in to continue to VGlytics."
            : "Create an account to save your expenses."}
        </p>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "11px 12px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              padding: "11px 12px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: "7px",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="Enter your email"
            autoComplete="email"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "11px",
              outline: "none",
              fontSize: "14px",
              marginBottom: "16px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Enter your password"
            autoComplete={
              isLogin ? "current-password" : "new-password"
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "11px",
              outline: "none",
              fontSize: "14px",
              marginBottom: "18px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "11px",
              background: loading ? "#8ac9c7" : "#0f9f9a",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={switchMode}
            style={{
              border: "none",
              background: "none",
              color: "#0f9f9a",
              fontWeight: 700,
              marginLeft: "5px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;