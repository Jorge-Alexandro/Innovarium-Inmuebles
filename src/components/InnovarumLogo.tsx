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
  return (
    <div className={`flex ${vertical ? "flex-col items-center text-center" : "items-center gap-3"} ${className}`} id="innovarum_logo_container">
      {/* Detailed Tree of Life (Canopy, Trunk, and Roots) SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 overflow-visible transition-transform duration-300 hover:scale-105"
        style={{ overflow: "visible" }}
        id="innovarum_logo_svg"
      >
        <g id="tree_of_life">
          {/* Canopy - Outer glow or guide circle if needed (invisible) */}
          <circle cx="100" cy="80" r="60" fill="transparent" />

          {/* TRUNK & MAIN BRANCHES */}
          <path
            d="M96 130 C96 115, 94 105, 90 95 C86 85, 80 78, 70 74 C68 73, 67 71, 69 69 C71 67, 73 68, 75 69 C88 74, 94 82, 97 94 C98 90, 97 85, 94 77 C90 67, 82 58, 72 53 C70 52, 69 50, 71 48 C73 46, 75 47, 77 48 C89 54, 96 65, 99 76 C100 70, 98 62, 93 51 C91 47, 88 43, 84 39 C82 37, 82 35, 84 33 C86 31, 88 32, 90 34 C95 39, 98 44, 100 50 C102 44, 105 39, 110 34 C112 32, 114 31, 116 33 C118 35, 118 37, 116 39 C112 43, 109 47, 107 51 C102 62, 100 70, 101 76 C104 65, 111 54, 123 48 C125 47, 127 46, 129 48 C131 50, 130 52, 128 53 C118 58, 110 67, 106 77 C103 85, 102 90, 103 94 C106 82, 112 74, 125 69 C127 68, 129 67, 131 69 C133 71, 132 73, 130 74 C120 78, 114 85, 110 95 C106 105, 104 115, 104 130 Z"
            fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            id="trunk_branches"
          />

          {/* LOWER TRUNK BASE */}
          <path
            d="M93 125 L107 125 L109 135 C109 138, 111 140, 114 142 L118 144 C122 146, 118 148, 113 147 L105 145 C103 144, 101 145, 100 147 L97 152 C95 155, 91 155, 91 151 L92 145 C92 143, 90 141, 88 141 L81 143 C76 144, 73 142, 76 139 L83 135 C86 133, 89 130, 91 127 Z"
            fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            id="trunk_base"
          />

          {/* ROOT SYSTEM (Winding, detailed roots branching downwards and outwards) */}
          <g id="root_system">
            {/* Main Central Roots */}
            <path
              d="M97 140 C97 148, 93 155, 91 162 C89 169, 84 174, 76 177 C74 178, 73 176, 74 174 C78 171, 84 167, 86 160 C88 153, 91 147, 93 140 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            <path
              d="M103 140 C103 148, 107 155, 109 162 C111 169, 116 174, 124 177 C126 178, 127 176, 126 174 C122 171, 116 167, 114 160 C112 153, 109 147, 107 140 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            {/* Left Roots */}
            <path
              d="M89 140 C85 143, 79 145, 73 147 C65 149, 58 152, 53 158 C51 160, 53 162, 55 161 C60 157, 66 154, 74 152 C80 150, 85 147, 88 142 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            <path
              d="M85 143 C78 147, 72 152, 65 156 C57 160, 50 166, 45 174 C44 176, 46 178, 48 176 C53 170, 59 165, 67 161 C74 157, 80 151, 84 145 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            {/* Right Roots */}
            <path
              d="M111 140 C115 143, 121 145, 127 147 C135 149, 142 152, 147 158 C149 160, 147 162, 145 161 C140 157, 134 154, 126 152 C120 150, 115 147, 112 142 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            <path
              d="M115 143 C122 147, 128 152, 135 156 C143 160, 150 166, 155 174 C156 176, 154 178, 152 176 C147 170, 141 165, 133 161 C126 157, 120 151, 116 145 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            {/* Root branches and rootlets */}
            <path
              d="M95 152 C91 157, 87 163, 85 170 C83 177, 81 184, 82 191 C82 193, 84 193, 84 191 C83 184, 85 178, 88 171 C90 165, 94 159, 97 154 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            <path
              d="M105 152 C109 157, 113 163, 115 170 C117 177, 119 184, 118 191 C118 193, 116 193, 116 191 C117 184, 115 178, 112 171 C110 165, 106 159, 103 154 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            <path
              d="M74 152 C68 157, 61 163, 56 170 C51 177, 49 185, 49 193 C49 195, 51 195, 51 193 C51 185, 53 178, 58 171 C63 165, 69 159, 75 154 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
            <path
              d="M126 152 C132 157, 139 163, 144 170 C149 177, 151 185, 151 193 C151 195, 149 195, 149 193 C149 185, 147 178, 142 171 C137 165, 131 159, 125 154 Z"
              fill={iconColor === "currentColor" ? "currentColor" : iconColor}
            />
          </g>

          {/* LUSH LEAF CANOPY - Detailed scattered leaves around the branches */}
          <g id="leaf_canopy">
            {/* Top Leaves */}
            <path d="M100 15 C97 22, 103 26, 100 32 C103 26, 103 22, 100 15 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M92 18 C88 24, 94 28, 93 34 C96 29, 96 24, 92 18 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M108 18 C112 24, 106 28, 107 34 C104 29, 104 24, 108 18 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            
            {/* Upper Left Leaves */}
            <path d="M84 22 C79 27, 85 32, 82 38 C86 33, 87 28, 84 22 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M75 26 C69 31, 75 36, 72 42 C76 37, 77 32, 75 26 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M66 32 C60 36, 65 42, 61 47 C66 43, 67 38, 66 32 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M58 40 C52 44, 56 50, 52 55 C57 51, 58 46, 58 40 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M52 50 C46 53, 49 60, 45 65 C50 61, 51 56, 52 50 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />

            {/* Upper Right Leaves */}
            <path d="M116 22 C121 27, 115 32, 118 38 C114 33, 113 28, 116 22 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M125 26 C131 31, 125 36, 128 42 C124 37, 123 32, 125 26 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M134 32 C140 36, 135 42, 139 47 C134 43, 133 38, 134 32 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M142 40 C148 44, 144 50, 148 55 C143 51, 142 46, 142 40 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M148 50 C154 53, 151 60, 155 65 C150 61, 149 56, 148 50 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />

            {/* Outer Left Branches/Leaves */}
            <path d="M48 62 C42 66, 44 73, 40 78 C45 74, 47 69, 48 62 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M45 75 C39 78, 40 85, 36 90 C41 86, 43 81, 45 75 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M44 88 C38 91, 39 98, 35 103 C40 99, 42 94, 44 88 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M46 101 C41 104, 41 111, 38 116 C42 112, 44 107, 46 101 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />

            {/* Outer Right Branches/Leaves */}
            <path d="M152 62 C158 66, 156 73, 160 78 C155 74, 153 69, 152 62 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M155 75 C161 78, 160 85, 164 90 C159 86, 157 81, 155 75 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M156 88 C162 91, 161 98, 165 103 C160 99, 158 94, 156 88 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M154 101 C159 104, 159 111, 162 116 C158 112, 156 107, 154 101 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />

            {/* Inner Canopy Clusters (creating depth) */}
            <path d="M78 45 C73 49, 77 55, 73 60 C78 56, 79 51, 78 45 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M68 55 C63 59, 67 65, 63 70 C68 66, 69 61, 68 55 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M60 68 C55 72, 59 78, 55 83 C60 79, 61 74, 60 68 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M58 82 C53 85, 56 92, 52 97 C57 93, 58 88, 58 82 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />

            <path d="M122 45 C127 49, 123 55, 127 60 C122 56, 121 51, 122 45 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M132 55 C137 59, 133 65, 137 70 C132 66, 131 61, 132 55 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M140 68 C145 72, 141 78, 145 83 C140 79, 139 74, 140 68 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M142 82 C147 85, 144 92, 148 97 C143 93, 142 88, 142 82 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />

            {/* Center-Left & Center-Right Canopy Filler */}
            <circle cx="86" cy="40" r="4.5" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="114" cy="40" r="4.5" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="94" cy="32" r="5" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="106" cy="32" r="5" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="74" cy="50" r="4" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="126" cy="50" r="4" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="66" cy="62" r="4" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="134" cy="62" r="4" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="58" cy="76" r="4" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <circle cx="142" cy="76" r="4" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            
            {/* Individual leaf silhouettes for artistic asymmetry */}
            <path d="M88 55 C84 62, 92 64, 90 71 C93 65, 92 59, 88 55 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M112 55 C116 62, 108 64, 110 71 C107 65, 108 59, 112 55 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M92 68 C88 75, 96 77, 94 84 C97 78, 96 72, 92 68 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M108 68 C112 75, 104 77, 106 84 C103 78, 104 72, 108 68 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            
            <path d="M78 72 C73 78, 81 81, 78 88 C82 82, 82 76, 78 72 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
            <path d="M122 72 C127 78, 119 81, 122 88 C118 82, 118 76, 122 72 Z" fill={iconColor === "currentColor" ? "currentColor" : iconColor} />
          </g>
        </g>
      </svg>

      {showText && (
        <div className={`flex flex-col ${vertical ? "items-center" : "items-start"} whitespace-nowrap`} id="innovarum_text_group">
          <span 
            className={`font-display select-none transition-colors duration-150 tracking-[0.25em] uppercase leading-none font-medium ${
              vertical ? "text-base mt-2" : "text-sm"
            } ${textColor}`}
            style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Georgia', serif" }}
            id="innovarum_title"
          >
            INNOVARUM
          </span>
          <span 
            className="text-[8px] font-medium tracking-[0.45em] uppercase mt-1 opacity-90 select-none transition-colors duration-150 whitespace-nowrap"
            style={{ 
              color: "#C5A059", 
              fontFamily: "'Montserrat', 'Inter', sans-serif" 
            }}
            id="innovarum_subtitle"
          >
            TECHNOLOGIES
          </span>
        </div>
      )}
    </div>
  );
};
