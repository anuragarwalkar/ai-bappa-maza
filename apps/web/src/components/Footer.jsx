import React from 'react';

/**
 * Presentational Footer Component showing creator attribution
 */
export function Footer({ className = 'app-footer' }) {
  return (
    <footer className={className}>
      <p className="footer-credit">
        Created by <span className="footer-heart">❤️</span> <span className="footer-author">Anurag Arwalkar</span>
      </p>
    </footer>
  );
}
