

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = '', size = 36, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt="Event Jell"
        className="object-contain flex-shrink-0"
        style={{
          height: size,
          width: 'auto',
          maxHeight: size * 1.5,
        }}
      />
    </div>
  );
}
