import { Link, usePathname } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useAppState } from '../state/AppState';
import { Onboarding } from './Onboarding';
import { colors, ui } from './ui';
const routes = [
  { href: '/', label: 'Study space', icon: '◈' },
  { href: '/saved', label: 'Saved', icon: '▤' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
] as const;
export function Shell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const path = usePathname();
  const { ready, storageError } = useAppState();
  if (!ready)
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator accessibilityLabel="Loading NotePilot" color={colors.accent} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={[styles.root, { flexDirection: wide ? 'row' : 'column' }]}>
      <View
        style={[
          styles.nav,
          wide ? { width: 222, borderRightWidth: 1 } : { borderBottomWidth: 1, padding: 16 },
        ]}
      >
        <View style={{ gap: 5, padding: 8 }}>
          <Text style={{ color: colors.ink, fontSize: 25, fontWeight: '700', letterSpacing: -1 }}>
            ◈ NotePilot
          </Text>
          <Text style={ui.eyebrow}>Companion</Text>
        </View>
        <View
          style={{
            flexDirection: wide ? 'column' : 'row',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: wide ? 32 : 4,
          }}
        >
          {routes.map((route) => (
            <Link key={route.href} href={route.href} replace asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: path === route.href }}
                style={({ pressed }) => [
                  styles.navItem,
                  {
                    backgroundColor: path === route.href ? colors.mint : 'transparent',
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: path === route.href ? colors.accent : colors.muted,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {route.icon} {route.label}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
        {wide && (
          <View style={{ marginTop: 'auto', padding: 8, gap: 10 }}>
            <Text style={ui.eyebrow}>Space to think</Text>
            <Text style={[ui.body, { fontSize: 13 }]}>
              A companion for your notes. A little clarity when you need it.
            </Text>
            <Text style={[ui.body, { fontSize: 11 }]}>FOUNDATION / 0.1</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        {storageError && (
          <Text
            accessibilityRole="alert"
            style={{ padding: 12, color: '#8D2F24', backgroundColor: '#FFECE6' }}
          >
            {storageError}
          </Text>
        )}
        {children}
      </View>
      <Onboarding />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  nav: { backgroundColor: '#FCFDFB', borderColor: colors.line, padding: 22, gap: 14 },
  navItem: { padding: 14, borderRadius: 12, minHeight: 48, justifyContent: 'center' },
});
