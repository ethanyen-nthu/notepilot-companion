import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useAppState } from '../state/AppState';
import { Button, colors, DemoBadge, ui } from './ui';
const pages = [
  {
    title: 'A little help.\nRight beside your notes.',
    text: 'Keep your thinking in your notebook. NotePilot is a focused study companion for the moment you get stuck.',
    number: '01',
    detail: 'Select → choose an action → keep learning',
  },
  {
    title: 'You choose\nwhat to share.',
    text: 'In a custom iOS build, use a supporting app’s Share menu to preview an image or text. Selections and Pencil strokes inside other apps are not automatically available.',
    number: '02',
    detail: 'Explicit sharing. No background monitoring.',
  },
  {
    title: 'Try it with\nzero uploads.',
    text: 'This foundation uses two synthetic math examples and scripted, simulated answers. Nothing is sent to an AI provider. Save only the explanations you choose.',
    number: '03',
    detail: 'Offline demo · No account · No API keys',
  },
];
export function Onboarding() {
  const { state, dispatch } = useAppState();
  const [page, setPage] = useState(0);
  const current = pages[page];
  return (
    <Modal
      visible={!state.onboarded}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => dispatch({ type: 'onboard' })}
    >
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }}
      >
        <View
          style={[
            ui.card,
            { width: '100%', maxWidth: 660, alignSelf: 'center', padding: 36, gap: 28 },
          ]}
        >
          <Text style={ui.eyebrow}>NotePilot / Companion</Text>
          <DemoBadge />
          <Text style={{ fontSize: 72, fontWeight: '200', color: '#81AB99' }}>
            {current.number}
          </Text>
          <Text accessibilityRole="header" style={[ui.title, { fontSize: 38 }]}>
            {current.title}
          </Text>
          <Text style={ui.body}>{current.text}</Text>
          <Text style={[ui.body, { color: colors.accent }]}>{current.detail}</Text>
          <Text accessibilityLabel={`Step ${page + 1} of 3`} style={ui.eyebrow}>
            {page + 1} / 3
          </Text>
          <Button onPress={() => (page === 2 ? dispatch({ type: 'onboard' }) : setPage(page + 1))}>
            {page === 2 ? 'Start the demo' : 'Continue'}
          </Button>
          {page > 0 && (
            <Button secondary onPress={() => setPage(page - 1)}>
              Back
            </Button>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}
