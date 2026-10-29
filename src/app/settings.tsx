import { GatewaySettings } from '../components/GatewaySettings';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Button, Card, colors, ui } from '../components/ui';
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
  { id: 'gemini', title: 'Gemini', detail: 'Not implemented in this milestone' },
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
        <Text style={ui.body}>
          Choose OpenAI for imported handwriting, then connect your gateway below. Demo uses
          synthetic examples only. Claude and Gemini remain unavailable.
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
      <GatewaySettings />
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
          Only a reviewed crop is uploaded after explicit consent, through your gateway to OpenAI.
          No analytics, microphone, or screen capture is used. Saved explanations use unencrypted
          app storage. Avoid sensitive notes; copied text enters the system clipboard.
        </Text>
        <Text style={ui.body}>
          Share previews are held only for the extension session. The extension does not modify the
          source document or open the containing app automatically.
        </Text>
      </Card>
      <Text style={ui.eyebrow}>NotePilot Companion · Handwriting intelligence</Text>
    </ScrollView>
  );
}
