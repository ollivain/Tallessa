import { StyleSheet, Text } from 'react-native';
import AppCard from './AppCard';
import SectionLabel from './SectionLabel';
import { colors, spacing, typography } from '../theme/designSystem';

// Soft empty-state card used when there is no content yet (e.g. no memories,
// no letters). Keeps the visual rhythm — never falls back to bare text.
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
  title: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
