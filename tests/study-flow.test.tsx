import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StudyScreen from '../src/app/index';
import SavedScreen from '../src/app/saved';
import SettingsScreen from '../src/app/settings';
import { Onboarding } from '../src/components/Onboarding';
import { AppStateProvider } from '../src/state/AppState';
beforeEach(async () => {
  await AsyncStorage.clear();
});
test('select work, check it, save, dismiss, then delete from settings', async () => {
  await render(
    <AppStateProvider>
      <StudyScreen />
      <SavedScreen />
      <SettingsScreen />
    </AppStateProvider>,
  );
  await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
  expect(screen.getByRole('button', { name: 'Check My Work' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Include work' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Check My Work' }));
  await screen.findByText(
    'Simulated answer · Scripted for the selected sample. No AI request was made.',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save explanation' }));
  expect(screen.getByRole('button', { name: 'Saved on this device' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
  expect(screen.queryByText('Temporary explanation')).toBeNull();
  expect(screen.getByText('Check My Work · 2x + 7 = 19')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete saved explanations' }));
  expect(screen.queryByText('Check My Work · 2x + 7 = 19')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear selection' }));
  expect(screen.getByRole('button', { name: 'Explain' })).toBeDisabled();
});
test('onboarding clearly introduces the simulation and exits', async () => {
  await render(
    <AppStateProvider>
      <Onboarding />
    </AppStateProvider>,
  );
  await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText(/This foundation uses two synthetic/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Start the demo' }));
  expect(screen.queryByText('Start the demo')).toBeNull();
});
