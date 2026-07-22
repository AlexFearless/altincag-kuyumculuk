export default function SunLogo({ className = 'w-8 h-8', color = 'currentColor', src = null }) {
  if (src) {
    return (
      <img
        src={src}
        alt="AltınÇağ Kuyumculuk"
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="10" fill={color} />
      <circle cx="32" cy="32" r="5.5" fill="white" opacity="0.3" />
      <path d="M32 24 L34 32 L32 29.5 L30 32 Z" fill={color} opacity="0.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={angle}
          x1="32"
          y1={i % 2 === 0 ? 7 : 13}
          x2="32"
          y2={i % 2 === 0 ? 17 : 20}
          stroke={color}
          strokeWidth={i % 2 === 0 ? 2.5 : 2}
          strokeLinecap="round"
          transform={`rotate(${angle} 32 32)`}
        />
      ))}
    </svg>
  );
}
