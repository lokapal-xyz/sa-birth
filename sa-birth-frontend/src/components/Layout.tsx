import { WalletSwitcher } from './WalletSwitcher';
import './Layout.css';

interface LayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  isAwakened?: boolean;
  awakenedCharacter?: number | null;
}

// Character-specific awakening colors - Pastel tones for the "real world"
const AWAKENED_COLORS = {
  0: '#4785e2', // Alice - Pastel blue (soft sky) 
  1: '#6aab8b', // Robert - Pastel green (soft nature)
  2: '#865da8', // Carol - Pastel purple (soft mystery)
};

export function Layout({ title, subtitle, children, isAwakened = false, awakenedCharacter = null }: LayoutProps) {
  const resolvedTitle = title || import.meta.env.VITE_GAME_TITLE || 'Stellar Game';
  const resolvedSubtitle = subtitle || import.meta.env.VITE_GAME_TAGLINE || 'Testnet dev sandbox';
  
  // Get character-specific pastel color or default soft grey
  const awakenedBg = awakenedCharacter !== null && AWAKENED_COLORS[awakenedCharacter as keyof typeof AWAKENED_COLORS]
    ? AWAKENED_COLORS[awakenedCharacter as keyof typeof AWAKENED_COLORS]
    : '#d8d8e0'; // Soft neutral grey as fallback

  return (
    <div 
      className="studio"
      style={{
        backgroundColor: isAwakened ? awakenedBg : '#0a0a0f',
        backgroundImage: isAwakened 
          ? `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 15px,
              rgba(255, 255, 255, 0.015) 15px,
              rgba(255, 255, 255, 0.015) 30px
            )`
          : 'none',
        transition: 'background-color 3s ease-in-out, background-image 3s ease-in-out',
      }}
    >
      <div className="studio-background" aria-hidden="true">
        <div 
          className="studio-orb orb-1"
          style={{
            opacity: isAwakened ? '0.15' : '0.15',
            transition: 'opacity 3s ease-in-out',
          }}
        />
        <div 
          className="studio-orb orb-2"
          style={{
            opacity: isAwakened ? '0.15' : '0.15',
            transition: 'opacity 3s ease-in-out',
          }}
        />
        <div 
          className="studio-orb orb-3"
          style={{
            opacity: isAwakened ? '0.15' : '0.15',
            transition: 'opacity 3s ease-in-out',
          }}
        />
        <div 
          className="studio-grid"
          style={{
            opacity: isAwakened ? '0.15' : '0.2',
            transition: 'opacity 3s ease-in-out',
          }}
        />
      </div>

      <header className="studio-header">
        <div className="brand">
          <div className="brand-title">{resolvedTitle}</div>
          <p className="brand-subtitle">{resolvedSubtitle}</p>
        </div>
        <div className="header-actions">
          <div className="network-pill">Testnet</div>
          <div className="network-pill dev-pill">Dev Wallets</div>
          <WalletSwitcher />
        </div>
      </header>

      <main className="studio-main">{children}</main>

      <footer className="studio-footer">
        <span>Built with the Stellar Game Studio</span>
      </footer>
    </div>
  );
}