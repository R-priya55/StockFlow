import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../services/api";

export default function Navbar() {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  // Refresh when the organization name is changed on the Settings page
  useEffect(() => {
    const refresh = () => setUser(getUser());
    window.addEventListener("userchange", refresh);
    return () => window.removeEventListener("userchange", refresh);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="org-name">{user?.organizationName}</div>
      <div className="navbar-user">
        <div>
          <div className="user-name">{user?.name}</div>
          <div className="user-email">{user?.email}</div>
        </div>
        <button className="btn btn-small" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}