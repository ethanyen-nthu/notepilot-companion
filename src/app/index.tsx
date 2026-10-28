import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { HandwrittenPreview } from '../components/HandwrittenPreview';
import { ResponseSheet } from '../components/ResponseSheet';
import { Button, Card, colors, DemoBadge, ui } from '../components/ui';
import {
  actions,
  examples,
  type ExampleId,
  type Selection,
  type TutorAction,
  type TutorResponse,
} from '../domain/tutoring';
import { demoProvider } from '../providers';
import { useAppState } from '../state/AppState';
const descriptions: Record<TutorAction, string> = {
  Explain: 'Understand the idea behind it',
  Solve: 'Walk through a complete solution',
  Hint: 'A nudge, without the answer',
  'Next Step': 'One manageable move forward',
  'Check My Work': 'Find the first point to revisit',
};
export default function StudyScreen() {
  const { width } = useWindowDimensions();
  const { state } = useAppState();
  const [exampleId, setExampleId] = useState<ExampleId>('linear');
  const [selection, setSelection] = useState<Selection>('question');
  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestVersion = useRef(0);
  const dismiss = useCallback(() => {
    requestVersion.current++;
    setResponse(null);
    setBusy(false);
  }, []);
  useFocusEffect(
    useCallback(
      () => () => {
        requestVersion.current++;
      },
      [],
    ),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', (next) => {
      if (state.hideOnBackground && next !== 'active') dismiss();
    });
    return () => listener.remove();
  }, [dismiss, state.hideOnBackground]);
  async function ask(action: TutorAction) {
    if (!selection || busy) return;
    const version = ++requestVersion.current;
    setBusy(true);
    setError(null);
    try {
      const result = await demoProvider.respond({ exampleId, selection, action });
      if (version === requestVersion.current) setResponse(result);
    } catch (cause) {
      if (version === requestVersion.current)
        setError(cause instanceof Error ? cause.message : 'Unable to show the sample.');
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={[ui.page, width < 600 && { padding: 16 }]}>
      <View style={ui.row}>
        <Text style={[ui.eyebrow, { flex: 1 }]}>Your study space</Text>
        <DemoBadge />
      </View>
      <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" style={ui.title}>
          {examples[exampleId].title}
        </Text>
        <Text style={ui.body}>
          Select a little. Understand a lot. Try a question before connecting your notes.
        </Text>
      </View>
      <View style={ui.row}>
        <Button
          secondary
          selected={exampleId === 'linear'}
          onPress={() => {
            dismiss();
            setExampleId('linear');
            setSelection('question');
          }}
        >
          Linear equation
        </Button>
        <Button
          secondary
          selected={exampleId === 'quadratic'}
          onPress={() => {
            dismiss();
            setExampleId('quadratic');
            setSelection('question');
          }}
        >
          Quadratic equation
        </Button>
        <Text style={[ui.body, { fontSize: 13 }]}>{examples[exampleId].topic}</Text>
      </View>
      <View
        style={{ flexDirection: width >= 1180 ? 'row' : 'column', gap: 22, alignItems: 'stretch' }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 16 }}>
          <HandwrittenPreview exampleId={exampleId} selection={selection} onSelect={setSelection} />
          <View style={ui.row}>
            <Button
              secondary
              selected={selection === 'question'}
              onPress={() => setSelection('question')}
            >
              Question only
            </Button>
            <Button
              secondary
              selected={selection === 'question-and-work'}
              onPress={() => setSelection('question-and-work')}
            >
              Include work
            </Button>
            <Button secondary disabled={!selection} onPress={() => setSelection(null)}>
              Clear selection
            </Button>
          </View>
        </View>
        <Card style={width >= 1180 ? { width: 320 } : undefined}>
          <Text style={ui.eyebrow}>A little assistance</Text>
          <Text accessibilityRole="header" style={ui.heading}>
            How can we help?
          </Text>
          <Text accessibilityLiveRegion="polite" style={[ui.body, { fontSize: 14 }]}>
            {!selection
              ? 'Select the question to begin.'
              : selection === 'question'
                ? 'Question selected. Include work to check it.'
                : 'Question + sample work selected.'}
          </Text>
          {actions.map((action, index) => {
            const disabled =
              !selection ||
              busy ||
              (action === 'Check My Work' && selection !== 'question-and-work');
            return (
              <Pressable
                key={action}
                accessibilityRole="button"
                accessibilityLabel={action}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => void ask(action)}
                style={({ pressed }) => ({
                  padding: 15,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: pressed ? colors.mint : colors.paper,
                  opacity: disabled ? 0.4 : 1,
                  gap: 6,
                })}
              >
                <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>
                  {['◎', '↗', '✧', '→', '✓'][index]} {action}
                </Text>
                <Text style={[ui.body, { fontSize: 12, lineHeight: 18 }]}>
                  {descriptions[action]}
                </Text>
              </Pressable>
            );
          })}
          <Text style={[ui.body, { fontSize: 12, lineHeight: 18 }]}>
            Offline demonstration. Every answer is simulated.
          </Text>
        </Card>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={{ color: '#8D2F24' }}>
          {error}
        </Text>
      )}
      <Card>
        <Text style={ui.eyebrow}>Made to sit beside your notebook</Text>
        <Text style={ui.body}>
          The native Share Extension previews text and images explicitly shared by a supporting app.
          Availability depends on that app’s export options. OCR, live AI, and screen awareness are
          future milestones.
        </Text>
      </Card>
      <ResponseSheet
        response={response}
        onDismiss={dismiss}
        onFollowUp={(action) => void ask(action)}
      />
    </ScrollView>
  );
}
