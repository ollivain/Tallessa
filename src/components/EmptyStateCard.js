import { StyleSheet, Text } from 'react-native';
import AppCard from './AppCard';
import SectionLabel from './SectionLabel';
import { colors, spacing, typography } from '../theme/designSystem';

// Soft empty-state card used when there is no content yet (e.g. no memories,
// no letters). Visuals mirror styles.css `.card` + `.empty-state` styling:
// ivory background, h3 serif title, muted body copy, optional eyebrow pill.
export default function EmptyStateCard({ eyebrow, title, body }) {
  return (
    <AppCard variant="soft">
      {eyebrow ? (
        <SectionLabel variant="pill" style={styles.eyebrow}>{eyebrow}</SectionLabel>
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  eyebrow: { marginBottom: spacing.xs },
  // PWA h3: 1.35rem ≈ 22px, color var(--moss-dark), line-height 1.12
  title: {
    fontFamily: typography.serif,
    fontSize:   typography.sizes.title,
    lineHeight: typography.lineHeights.title,
    color:      colors.textPrimary,
    marginBottom: 6,
  },
  // PWA .empty-state / .memory-body p: color var(--muted), line-height 1.55
  body: {
    fontSize:   typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    color:      colors.textMuted,
  },
});
