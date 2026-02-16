import { useState } from 'react';
import { Camera } from 'lucide-react';

interface PhotoProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showModal?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-32 h-32',
};

export function Photo({ src, alt = 'Photo', size = 'md', className = '', showModal = true }: PhotoProps) {
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleError = () => {
    setError(true);
  };

  const handleClick = () => {
    if (showModal && src && !error) {
      setModalOpen(true);
    }
  };

  if (!src || error) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-brown-100 flex items-center justify-center ${className}`}>
        <Camera size={size === 'sm' ? 14 : size === 'md' ? 18 : size === 'lg' ? 24 : 32} className="text-brown-400" />
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onError={handleError}
        onClick={handleClick}
      />
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-center mt-4">{alt}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Photo;
