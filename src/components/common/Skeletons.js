import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm:'w-4 h-4 border-2', md:'w-6 h-6 border-2', lg:'w-8 h-8 border-3', xl:'w-12 h-12 border-4' };
  return <div className={`${s[size]} border-gray-200 border-t-orange-600 rounded-full animate-spin ${className}`} />;
};

export const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Spinner size="xl" />
  </div>
);

export const CardSkeleton = () => (
  <div className="card overflow-hidden animate-pulse">
    <div className="skeleton aspect-square" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-3 w-1/3 rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="flex justify-between mt-3">
        <div className="skeleton h-6 w-20 rounded" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
    </div>
  </div>
);

export const GridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

export const RowSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        {[1,2,3,4,5].map(j => <div key={j} className="skeleton h-4 flex-1 rounded" />)}
      </div>
    ))}
  </div>
);
