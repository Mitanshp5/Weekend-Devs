/**
 * DonutChart — SVG-based donut chart for Magoosh-style mastery visualization.
 * No external library needed.
 */

interface DonutChartProps {
  /** Value 0-100 */
  value: number;
  /** Diameter in px */
  size?: number;
  /** Stroke thickness in px */
  strokeWidth?: number;
  /** Fill color */
  color?: string;
  /** Track (background) color */
  trackColor?: string;
  /** Text to show inside — defaults to `${value}` */
  label?: string;
  /** Font size for the label, defaults to size/4 */
  labelSize?: number;
}

export function DonutChart({
  value,
  size = 120,
  strokeWidth = 10,
  color = "#553285",
  trackColor = "#e8e0f0",
  label,
  labelSize,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const fontSize = labelSize ?? size / 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${clamped}%`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset .6s ease" }}
      />
      {/* Label */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={fontSize}
        fontWeight={800}
        fontFamily='"Inter", "Segoe UI", sans-serif'
      >
        {label ?? clamped}
      </text>
    </svg>
  );
}
