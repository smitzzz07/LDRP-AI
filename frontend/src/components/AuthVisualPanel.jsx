import React, { Component } from "react";
import { GrainGradient } from "@paper-design/shaders-react";

class ShaderErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn("GrainGradient fallback triggered:", error);
  }

  render() {
    if (this.state.hasError) {
      return <div className="auth-gradient-fallback" />;
    }
    return this.props.children;
  }
}

export default function AuthVisualPanel({
  titleTop = "Think fast,",
  titleBottom = "Learn faster",
}) {
  return (
    <div className="auth-visual-panel">
      {/* Background Shader with Deep Blue Theme */}
      <ShaderErrorBoundary>
        <GrainGradient
          speed={0.8}
          scale={1.1}
          rotation={15}
          offsetX={0}
          offsetY={0}
          softness={0.55}
          intensity={0.65}
          noise={0.28}
          shape="corners"
          frame={2854.5}
          colors={["#E0E7FF", "#172aff", "#2837c7", "#060919"]}
          colorBack="#060713"
          className="auth-visual-shader"
        />
      </ShaderErrorBoundary>

      {/* Decorative ambient glow overlays for dark blue aesthetics */}
      <div className="auth-visual-glow auth-visual-glow-top" />
      <div className="auth-visual-glow auth-visual-glow-bottom" />

      {/* Overlay Content */}
      <div className="auth-visual-content">
        <div className="auth-visual-header">
          <h2 className="auth-visual-title">
            {titleTop}
            <br />
            <span className="auth-visual-title-gradient">{titleBottom}</span>
          </h2>
        </div>
      </div>
    </div>
  );
}
