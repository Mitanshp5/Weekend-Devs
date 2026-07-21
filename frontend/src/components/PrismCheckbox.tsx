import React from "react";

interface PrismCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  size?: number | string;
}

export function PrismCheckbox({
  label,
  checked,
  onChange,
  className = "",
  size = "24px",
  disabled,
  ...props
}: PrismCheckboxProps) {
  return (
    <label className={`checkbox-wrapper ${disabled ? "disabled" : ""} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <div className="checkmark" style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 6L9 17L4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {label && <span className="label">{label}</span>}
    </label>
  );
}

export default PrismCheckbox;
