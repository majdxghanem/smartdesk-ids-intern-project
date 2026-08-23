import { Link } from "react-router-dom";
import "../styles/not-found.css";

function NotFound() {
  const isSignedIn = Boolean(localStorage.getItem("token"));

  return (
    <main className="not-found-page">
      <img src="/smartdesk-logo.svg" alt="SmartDesk" />
      <span>404</span>
      <h1>This page could not be found.</h1>
      <p>The address may be incorrect, or the page may have moved.</p>
      <Link to={isSignedIn ? "/dashboard" : "/"}>{isSignedIn ? "Return to dashboard" : "Return to sign in"}</Link>
    </main>
  );
}

export default NotFound;
