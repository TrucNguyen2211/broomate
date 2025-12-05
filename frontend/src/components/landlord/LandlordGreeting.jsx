import React from "react";
import "./landlord-dashboard.css";

function LandlordGreeting({ name, lastLogin }) {
  return (
    <section className="ldb-panel ldb-hello">
      <h1 className="ldb-h1">Landlord Dashboard</h1>
      <p className="ldb-sub">Welcome back, {name}! 👋</p>
      <p className="ldb-meta">Last login: {lastLogin}</p>
    </section>
  );
}

export default LandlordGreeting;
