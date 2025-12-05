import React from 'react';
import Icon from './Icon';
import './Badge.css';

function Badge({ text, variant = "info", iconName = null }) {
  const className = `badge badge-${variant}`;
  
  const iconColorMap = {
    success: "#155724",
    danger: "#721c24",
    info: "#495057"
  };
  
  const currentIconColor = iconColorMap[variant] || "#495057";
  
  return (
    <span className={className}>
      {iconName && (
        <>
          <Icon name={iconName} size="small" color={currentIconColor} />
          <span style={{ marginRight: "6px" }} />
        </>
      )}
      {text}
    </span>
  );
}

export default Badge;