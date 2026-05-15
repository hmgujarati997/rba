import React from "react";

export function CardSkeleton() {
  return (
    <div className="card-luxe p-5 animate-fadeIn" data-testid="skeleton-card">
      <div className="flex items-center gap-4">
        <div className="skeleton w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
      </div>
    </div>
  );
}

export function LineSkeleton({ w = "100%" }) {
  return <div className="skeleton h-3" style={{ width: w }} />;
}
