import "./GradientText.css";

export default function GradientText({
  children,
  className = "",
  colors = ["#FF4500", "#FFD700", "#8B0000", "#FFD700", "#FF4500"], // OrangeRed, Gold, DarkRed
  animationSpeed = 5, // Velocidade um pouco mais rápida
  showBorder = false, // Default overlay visibility
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div className={`animated-gradient-text ${className}`}>
      {showBorder && <div className="gradient-overlay" style={gradientStyle}></div>}
      <div className="text-content" style={gradientStyle}>{children}</div>
    </div>
  );
}
