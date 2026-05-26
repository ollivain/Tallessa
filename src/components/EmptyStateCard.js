import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme/designSystem';

// Plain empty-state text used when there is no content yet. PWA list screens
// render `.empty-state` paragraphs directly, without wrapping them in cards.
export default function EmptyStateCard({ eyebrow, title, body }) {
  if (!title) {
    return (
      <View style={styles.plainWrap}>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.plainWrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plainWrap: { paddingHorizontal: 4, paddingVertical: 10 },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.eyebrow,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.eyebrow,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
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
