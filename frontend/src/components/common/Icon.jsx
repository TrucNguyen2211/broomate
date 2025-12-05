import React from 'react';
import './Icon.css';

// Icon map - replace with actual icon library later
const ICON_MAP = {
  "search": "🔍",
  "bookmark": "⭐",
  "close": "❌",
  "chat": "💬",
  "report": "🚩",
  "like": "❤️",
  "skip": "➡️",
};

function Icon({ name, size = "medium", color = null, onClick = null }) {
  const iconContent = ICON_MAP[name];
  
  if (!iconContent) {
    return <span style={{ color: "red" }}>❓</span>;
  }
  
  const className = `icon-root icon-${size}`;
  const style = { color: color || "inherit" };
  
  return (
    <span className={className} style={style} onClick={onClick}>
      {iconContent}
    </span>
  );
}

export default Icon;