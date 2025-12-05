import React from "react";
import { MapPin } from "lucide-react";
import Avatar from "../common/Avatar";              // ← chỉnh path đúng với project bạn
import "./published-room-card.css";

export default function PublishedRoomCard({
  title,
  location,
  description,
  photos = 8,
  badge = "Fully furnished",
  status = "available",           // "available" | "rented"
  tenant,                         // { name, avatar }
  avatars = [],                   // contact avatars (for available)
  contactName = "",
  lookingFor = "Flatmate",
  subletDuration = "1–6 Months",
  rentLabel = "₫ 12.000.000",
  prefGender = "Male",
  prefOther = "No",
  imgUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop",
}) {
  const dots = Array.from({ length: photos });
  console.log("tenant:", tenant);
  return (
    <article className="lp-card">
      <div className="lp-media">
        <img src={imgUrl} alt={title || "Room photo"} loading="lazy" />
        {badge && <div className="lp-chip">{badge}</div>}
        {status === "rented" && <div className="lp-status">Rented</div>}
        <div className="lp-dots">
          {dots.map((_, i) => <span key={i} className="dot" />)}
        </div>
      </div>

      {/* Title + location chung một hàng */}
      <div className="lp-titleRow">
        <h3 className="lp-title">{title || "—"}</h3>
        {location && (
          <div className="lp-locChip" title={location}>
            <MapPin size={14} strokeWidth={2.4} />
            <span className="text-ellipsis">{location}</span>
          </div>
        )}
      </div>

      {description && <p className="lp-desc">{description}</p>}

      {status === "rented" ? (
        <div className="lp-renter">
          <span className="k">Renter:</span>
          <div className="lp-renterInfo">
            <Avatar imageUrl={tenant?.avatar} size="small" altText={tenant?.name} />
            <span className="v">{tenant?.name || "Not assigned currently"}</span>
          </div>
        </div>
      ) : (
        <div className="lp-contact">
          <div className="lp-avatars">
            {avatars.slice(0, 2).map((a, i) => (
              <Avatar key={i} imageUrl={a.src} size="small" altText={a.alt || "U"} />
            ))}
          </div>
          {contactName && (
            <a className="lp-name" href="#" onClick={(e) => e.preventDefault()}>
              {contactName}
            </a>
          )}
        </div>
      )}

      <div className="lp-meta">
        <div className="row"><span className="k">Looking for:</span><span className="v">{lookingFor}</span></div>
        <div className="row"><span className="k">Sublet duration:</span><span className="v">{subletDuration}</span></div>
        <div className="row"><span className="k">Rent:</span><span className="v">{rentLabel}</span></div>
        <div className="row"><span className="k">Preference:</span><span className="v">{prefGender}</span></div>
        <div className="row"><span className="k">Preference:</span><span className="v">{prefOther}</span></div>
      </div>
    </article>
  );
}
