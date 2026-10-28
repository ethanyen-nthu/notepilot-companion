import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
export const colors = {
  ink: '#172F33',
  muted: '#52686B',
  accent: '#126B5C',
  mint: '#E3F2E9',
  paper: '#FBFAF6',
  bg: '#F2F4F0',
  line: '#D8E1DA',
  white: '#FFFFFF',
  amber: '#80551B',
};
export const ui = StyleSheet.create({
  title: { color: colors.ink, fontSize: 34, fontWeight: '700', letterSpacing: -1.1 },
  heading: { color: colors.ink, fontSize: 21, fontWeight: '600', letterSpacing: -0.4 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    gap: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  page: { padding: 28, gap: 24, width: '100%', maxWidth: 1400, alignSelf: 'center' },
});
export function Button({
  children,
  onPress,
  disabled = false,
  secondary = false,
  selected = false,
  accessibilityLabel,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  selected?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderRadius: 14,
        justifyContent: 'center',
        backgroundColor: secondary ? (selected ? colors.mint : '#EFF3EF') : colors.accent,
        borderWidth: 1,
        borderColor: selected ? colors.accent : 'transparent',
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      })}
    >
      <Text
        style={{
          color: secondary ? colors.ink : colors.white,
          fontSize: 15,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[ui.card, style]}>{children}</View>;
}
export function DemoBadge() {
  return (
    <View
      style={{
        backgroundColor: colors.mint,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.7 }}>
        ● DEMO · SIMULATED AI
      </Text>
    </View>
  );
}
