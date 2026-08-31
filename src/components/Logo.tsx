

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = '', size = 36, showText = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src="/logo.png"
        alt="EventJell"
        className="object-contain flex-shrink-0"
        style={{
          height: size,
          width: 'auto',
        }}
      />
    </div>
  );
}
