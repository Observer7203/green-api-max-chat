import type { CSSProperties } from 'react';

import styles from './avatar.module.css';
import { UserIcon } from './icons';

interface AvatarProps {
  name: string;
  /** Picks the colour, so a chat keeps it even when its name changes. */
  seed: string;
}

const getHue = (seed: string): number =>
  [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 0);

/** Up to two initials; nothing for names without letters, such as a phone number. */
const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .map((word) => word.match(/\p{L}/u)?.[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const Avatar = ({ name, seed }: AvatarProps) => {
  const initials = getInitials(name);

  return (
    <span
      className={styles.avatar}
      style={{ '--avatar-hue': getHue(seed) } as CSSProperties}
      aria-hidden="true"
    >
      {initials || <UserIcon />}
    </span>
  );
};
