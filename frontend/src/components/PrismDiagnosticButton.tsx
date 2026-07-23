import React from "react";
import { Link } from "react-router-dom";

interface PrismDiagnosticButtonProps {
  to?: string;
  onClick?: () => void;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PrismDiagnosticButton({
  to,
  onClick,
  text = "Start diagnostic",
  className = "",
  style,
}: PrismDiagnosticButtonProps) {
  const content = (
    <span className="text-container">
      <span className="text">{text}</span>
    </span>
  );

  const combinedClassName = `btn-17 ${className}`.trim();

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={combinedClassName} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={combinedClassName} style={style}>
      {content}
    </button>
  );
}

export default PrismDiagnosticButton;
