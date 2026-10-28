import { ScrollView, Switch, Text, View } from 'react-native';
import { Button, Card, colors, DemoBadge, ui } from '../components/ui';
import { type ProviderId } from '../domain/tutoring';
import { useAppState } from '../state/AppState';
const choices: { id: ProviderId; title: string; detail: string }[] = [
  {
    id: 'demo',
    title: 'Offline demonstration',
    detail: 'Available now · scripted synthetic examples',
  },
  { id: 'openai', title: 'OpenAI', detail: 'Preference only · secure gateway not configured' },
  {
    id: 'anthropic',
    title: 'Anthropic',
    detail: 'Preference only · secure gateway not configured',
  },
];
export default function SettingsScreen() {
  const { state, dispatch } = useAppState();
  return (
    <ScrollView contentContainerStyle={ui.page}>
      <Text style={ui.eyebrow}>Your companion, your controls</Text>
      <Text accessibilityRole="header" style={ui.title}>
        Settings & privacy
      </Text>
      <Card>
        <Text style={ui.heading}>AI provider preference</Text>
        <DemoBadge />
        <Text style={ui.body}>
          Choose a provider for a future connection. The study space always runs the offline demo in
          this release. No credentials are collected.
        </Text>
        {choices.map((choice) => (
          <View key={choice.id} style={{ gap: 6 }}>
            <Button
              secondary
              selected={state.provider === choice.id}
              onPress={() => dispatch({ type: 'provider', provider: choice.id })}
            >
              {choice.title}
            </Button>
            <Text style={[ui.body, { fontSize: 13 }]}>{choice.detail}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={ui.heading}>Local data</Text>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={ui.heading}>Allow local saves</Text>
            <Text style={ui.body}>
              Turning this off removes saved explanations. Temporary answers are never stored.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Allow local saves"
            trackColor={{ true: colors.accent }}
            value={state.saveLocally}
            onValueChange={(value) => dispatch({ type: 'privacy', key: 'saveLocally', value })}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={ui.heading}>Dismiss when leaving</Text>
            <Text style={ui.body}>
              Clear the temporary response when the app becomes inactive. This is not a screenshot
              protection feature.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Dismiss when leaving"
            trackColor={{ true: colors.accent }}
            value={state.hideOnBackground}
            onValueChange={(value) => dispatch({ type: 'privacy', key: 'hideOnBackground', value })}
          />
        </View>
        <Button secondary onPress={() => dispatch({ type: 'clear' })}>
          Delete saved explanations
        </Button>
        <Text accessibilityLiveRegion="polite" style={ui.body}>
          {state.saved.length} explanations saved on this device.
        </Text>
      </Card>
      <Card>
        <Text style={ui.heading}>A clear boundary</Text>
        <Text style={ui.body}>
          No AI uploads, analytics, microphone access, screen capture, or background monitoring are
          implemented. Local settings and saved synthetic explanations use unencrypted app storage;
          do not use this foundation for sensitive notes.
        </Text>
        <Text style={ui.body}>
          Share previews are held only for the extension session. The extension does not modify the
          source document or open the containing app automatically.
        </Text>
      </Card>
      <Text style={ui.eyebrow}>NotePilot Companion · Foundation 0.1.0</Text>
    </ScrollView>
  );
}
