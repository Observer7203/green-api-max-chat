import styles from './avatar.module.css';
import { UserIcon } from './icons';

/** Up to two initials; nothing for names without letters, such as a phone number. */
const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .map((word) => word.match(/\p{L}/u)?.[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const Avatar = ({ name }: { name: string }) => (
  <span className={styles.avatar} aria-hidden="true">
    {getInitials(name) || <UserIcon />}
  </span>
);
