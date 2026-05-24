import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, inputStyles } from '../theme/designSystem';

export default function AppInput({ label, style, inputStyle, multiline, ...rest }) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={inputStyles.label}>{label}</Text> : null}
      <TextInput
        style={[
          inputStyles.base,
          multiline && styles.multiline,
          inputStyle,
        ]}
        placeholderTextColor={colors.textSoft}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  multiline: {
    minHeight: 108,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
});
