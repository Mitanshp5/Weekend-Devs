import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface PrismArrowButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  text?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
  isFadingText?: boolean;
  iconRef?: React.RefObject<HTMLSpanElement | null>;
}

export const PrismArrowButton = forwardRef<HTMLButtonElement, PrismArrowButtonProps>(
  (
    {
      text,
      children,
      fullWidth = false,
      isFadingText = false,
      iconRef,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const content = children || text || "let's go!";

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        whileHover={disabled || isFadingText ? undefined : { scale: 1.015 }}
        whileTap={disabled || isFadingText ? undefined : { scale: 0.985 }}
        className={`Btn-Container prism-theme-btn icon-left ${fullWidth ? "full-width" : ""} ${className}`}
        {...props}
      >
        <span ref={iconRef} className="icon-Container">
          <svg width={16} height={19} viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="1.61321" cy="1.61321" r="1.5" fill="#10281e" />
            <circle cx="5.73583" cy="1.61321" r="1.5" fill="#10281e" />
            <circle cx="5.73583" cy="5.5566" r="1.5" fill="#10281e" />
            <circle cx="9.85851" cy="5.5566" r="1.5" fill="#10281e" />
            <circle cx="9.85851" cy="9.5" r="1.5" fill="#10281e" />
            <circle cx="13.9811" cy="9.5" r="1.5" fill="#10281e" />
            <circle cx="5.73583" cy="13.4434" r="1.5" fill="#10281e" />
            <circle cx="9.85851" cy="13.4434" r="1.5" fill="#10281e" />
            <circle cx="1.61321" cy="17.3868" r="1.5" fill="#10281e" />
            <circle cx="5.73583" cy="17.3868" r="1.5" fill="#10281e" />
          </svg>
        </span>
        <span className={`text ${isFadingText ? "text-fading" : ""}`}>{content}</span>
      </motion.button>
    );
  }
);

PrismArrowButton.displayName = "PrismArrowButton";

export default PrismArrowButton;
