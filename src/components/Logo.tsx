

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <div
      className={`rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #0F6E56 0%, #10b981 100%)',
        boxShadow: '0 4px 12px rgba(15, 110, 86, 0.25)',
        fontSize: size * 0.4,
        letterSpacing: '-0.05em',
      }}
    >
      EJ
    </div>
  );
}
