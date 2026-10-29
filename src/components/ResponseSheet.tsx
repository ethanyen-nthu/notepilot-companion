import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { MathText } from './MathText';
import { Modal, ScrollView, Text, View } from 'react-native';
import { type TutorAction, type TutorResponse } from '../domain/tutoring';
import { useAppState } from '../state/AppState';
import { Button, colors, DemoBadge, ui } from './ui';
export function ResponseSheet({
  response,
  onDismiss,
  onFollowUp,
}: {
  response: TutorResponse | null;
  onDismiss: () => void;
  onFollowUp: (action: TutorAction) => void;
}) {
  const { state, dispatch } = useAppState();
  const [copyMessage, setCopyMessage] = useState('');
  if (!response) return null;
  const saved = state.saved.some((item) => item.id === response.id);
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onDismiss}>
      <View
        style={{ flex: 1, backgroundColor: '#102C3866', justifyContent: 'center', padding: 24 }}
      >
        <View
          accessibilityViewIsModal
          style={{
            maxHeight: '90%',
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
            backgroundColor: colors.paper,
            borderRadius: 26,
            overflow: 'hidden',
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 28, gap: 22 }}>
            <View style={ui.row}>
              {response.simulated ? (
                <DemoBadge />
              ) : (
                <Text style={ui.eyebrow}>OpenAI � {response.model}</Text>
              )}
              <Text style={ui.eyebrow}>Temporary explanation</Text>
            </View>
            <Text accessibilityRole="header" style={ui.title}>
              {response.title}
            </Text>
            <Text style={ui.body}>
              Simulated answer · Scripted for the selected sample. No AI request was made.
            </Text>
            {!response.simulated && (
              <View style={{ gap: 12 }}>
                <Text style={ui.eyebrow}>Recognition: {response.analysis.reading}</Text>
                <MathText text={response.analysis.problem} />
                {response.analysis.uncertainty.map((note, i) => (
                  <Text key={i} style={{ color: '#8D2F24' }}>
                    {note}
                  </Text>
                ))}
                <Text style={ui.body}>
                  Where you stopped: {response.analysis.stoppedAt || 'Not established.'}
                </Text>
                {response.action === 'Check My Work' &&
                  response.analysis.observedSteps.map((step, i) => (
                    <View key={i} style={{ gap: 4 }}>
                      <Text style={ui.eyebrow}>{step.verdict} � AI assessment</Text>
                      <MathText text={step.text} />
                      <MathText text={step.reason} />
                    </View>
                  ))}
              </View>
            )}
            {response.steps.map((step, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 14 }}>
                <Text style={[ui.eyebrow, { paddingTop: 5 }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <MathText text={step} />
              </View>
            ))}
            <Text style={ui.eyebrow}>
              {response.simulated ? 'Explore this sample' : 'Continue from this selection'}
            </Text>
            <View style={ui.row}>
              <Button secondary onPress={() => onFollowUp('Explain')}>
                Explain Further
              </Button>
              <Button secondary onPress={() => onFollowUp('Next Step')}>
                Next Step
              </Button>
            </View>
            <Text style={[ui.body, { fontSize: 13 }]}>
              {response.simulated
                ? 'These follow-ups are scripted too. Dismissing clears this temporary answer.'
                : 'Follow-ups re-use the crop and previous feedback, with fresh upload consent. Saving keeps text locally in unencrypted app storage; no image is saved.'}
            </Text>
            <View style={ui.row}>
              <Button
                disabled={!state.saveLocally || saved}
                onPress={() => dispatch({ type: 'save', response })}
              >
                {saved ? 'Saved on this device' : 'Save explanation'}
              </Button>
              <Button
                secondary
                onPress={async () => {
                  try {
                    await Clipboard.setStringAsync(
                      [
                        response.simulated ? 'SIMULATED' : 'AI-generated; verify reasoning',
                        response.title,
                        ...response.steps,
                        ...(!response.simulated ? response.analysis.uncertainty : []),
                      ].join('\n\n'),
                    );
                    setCopyMessage('Copied');
                  } catch {
                    setCopyMessage('Could not copy.');
                  }
                }}
              >
                Copy
              </Button>
              <Button secondary onPress={onDismiss}>
                Dismiss
              </Button>
            </View>
            {!!copyMessage && (
              <Text accessibilityLiveRegion="polite" style={ui.body}>
                {copyMessage}
              </Text>
            )}
            {!state.saveLocally && (
              <Text style={ui.body}>
                Local saving is off. Enable it in Settings to keep this explanation.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
