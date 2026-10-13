"use client";

import { Component, type ReactNode } from "react";

export default class EnergyVisualizationBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <div role="status" className="rounded-xl border border-amber-400/30 bg-black/40 p-6 text-sm text-gray-200">
        3D visualization unavailable in this browser. Reference tables and calculators remain available. On Infrastructure, use the 2D Map view.
      </div>
    );
    return this.props.children;
  }
}