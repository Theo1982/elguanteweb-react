import React from 'react';

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating" role="radiogroup" aria-label="Rating stars">
      {stars.map(star => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={!readonly ? () => onRatingChange(star) : undefined}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
          aria-label={`${star} star ${star <= rating ? 'filled' : 'empty'}`}
          role={!readonly ? 'radio' : 'img'}
          aria-checked={star <= rating}
          tabIndex={!readonly ? 0 : -1}
          onKeyDown={
            !readonly
              ? e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onRatingChange(star);
                  }
                }
              : undefined
          }
        >
          ★
        </span>
      ))}
      <style>{`
        .star-rating {
          display: flex;
          gap: 2px;
        }
        .star {
          color: #ddd;
          font-size: 18px;
          transition: color 0.2s;
          user-select: none;
        }
        .star.filled {
          color: #ffd700;
        }
        .star:focus {
          outline: 2px solid #007bff;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default StarRating;
