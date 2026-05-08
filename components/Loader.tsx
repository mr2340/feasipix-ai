
import React from 'react';

const Loader = ({ large = false }: { large?: boolean }) => {
  const sizeClasses = large ? 'w-12 h-12' : 'w-5 h-5';
  const borderClasses = large ? 'border-4' : 'border-2';

  return (
    <div
      role="status"
      className={`${sizeClasses} ${borderClasses} border-t-transparent border-solid animate-spin rounded-full border-white`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;