import React from "react";

interface AudioWaveIconProps {
  className?: string;
  size?: number;
}

export default function AudioWaveIcon({ className = "w-6 h-6 text-white", size }: AudioWaveIconProps) {
  const widthHeightProps = size ? { width: size, height: size } : {};

  return (
    <svg
      className={className}
      {...widthHeightProps}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20">
        <animate attributeName="d" values="M12 6v12;M12 2v20;M12 6v12" dur="0.8s" repeatCount="indefinite" />
      </path>
      <path d="M6 8v8">
        <animate attributeName="d" values="M6 10v4;M6 4v16;M6 10v4" dur="0.8s" repeatCount="indefinite" begin="0.15s" />
      </path>
      <path d="M18 8v8">
        <animate attributeName="d" values="M18 10v4;M18 4v16;M18 10v4" dur="0.8s" repeatCount="indefinite" begin="0.3s" />
      </path>
      <path d="M2 11v2">
        <animate attributeName="d" values="M2 11v2;M2 8v8;M2 11v2" dur="0.8s" repeatCount="indefinite" begin="0.45s" />
      </path>
      <path d="M22 11v2">
        <animate attributeName="d" values="M22 11v2;M22 8v8;M22 11v2" dur="0.8s" repeatCount="indefinite" begin="0.6s" />
      </path>
    </svg>
  );
}
