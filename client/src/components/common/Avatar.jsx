import React from "react";

// Props: src (image url), name (string for initials), sizeClass (tailwind classes for sizing)
const Avatar = ({
  src,
  name = "User",
  sizeClass = "w-12 h-12",
  className = "rounded-full",
  alt,
}) => {
  const initials = (name || "")
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`${sizeClass} ${className} object-cover border`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} ${className} bg-gray-100 flex items-center justify-center text-lg font-semibold text-primary-dark border`}
    >
      {initials}
    </div>
  );
};

export default Avatar;
