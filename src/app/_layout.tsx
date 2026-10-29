import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Shell } from '../components/Shell';
import { AppStateProvider } from '../state/AppState';
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Shell>
          <Slot />
        </Shell>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
