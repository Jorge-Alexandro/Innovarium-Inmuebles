import React from "react";

interface InnovarumLogoProps {
  className?: string;
  size?: number; // Size of the icon
  showText?: boolean; // Whether to show "INNOVARUM TECHNOLOGIES"
  textColor?: string; // Tailwind class for text color, e.g., "text-[#0A1B3D]"
  iconColor?: string; // Color of the SVG tree, e.g., "currentColor" or hex
  vertical?: boolean; // If true, places text under the icon. If false, text is on the right.
}

export const InnovarumLogo: React.FC<InnovarumLogoProps> = ({
  className = "",
  size = 40,
  showText = true,
  textColor = "text-[#0A1B3D]",
  iconColor = "currentColor",
  vertical = false,
}) => {
  // Determine width based on the context/props to match user instructions:
  // - Sidebar escritorio: ancho máximo 230px (vertical={true})
  // - Tarjeta principal: ancho máximo 210px (size={52})
  // - Encabezado móvil: ancho 72px (size={32})
  let widthClass = "w-auto";
  
  if (vertical) {
    widthClass = "w-full max-w-[230px]";
  } else if (size === 32) {
    widthClass = "w-[72px]";
  } else if (size === 52) {
    widthClass = "w-full max-w-[210px]";
  }

  return (
    <div className={`flex items-center justify-center ${className}`} id="innovarum_logo_container">
      <img
        src="/logo-innovarum.png?v=1"
        alt="Innovarum Technologies"
        draggable={false}
        className="block object-contain select-none h-auto w-full"
        style={{
          maxWidth: vertical ? "230px" : size === 32 ? "72px" : size === 52 ? "210px" : `${size * 3}px`
        }}
      />
    </div>
  );
};
