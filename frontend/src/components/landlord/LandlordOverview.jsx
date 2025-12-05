import React from "react";
import "./landlord-dashboard.css";

function LandlordOverview({ stats, isOwnDashboard, name }) {
  const heading = isOwnDashboard
    ? "📊 MY ROOMS OVERVIEW"
    : `📊 ${name}'s ROOMS OVERVIEW`;

  return (
    <section className="ldb-panel">
      <h2 className="ldb-h2">{heading}</h2>
      <hr className="ldb-sep" />
      <div className="ldb-kpis">
        <div className="ldb-kpi">
          <span className="k">Total</span>
          <b>{stats.total}</b>
        </div>
        <div className="ldb-kpi">
          <span className="k">Available</span>
          <b>{stats.available}</b>
        </div>
        <div className="ldb-kpi">
          <span className="k">Rented</span>
          <b>{stats.rented}</b>
        </div>
      </div>
    </section>
  );
}

export default LandlordOverview;
