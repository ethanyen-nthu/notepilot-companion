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
              <DemoBadge />
              <Text style={ui.eyebrow}>Temporary explanation</Text>
            </View>
            <Text accessibilityRole="header" style={ui.title}>
              {response.title}
            </Text>
            <Text style={ui.body}>
              Simulated answer · Scripted for the selected sample. No AI request was made.
            </Text>
            {response.steps.map((step, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 14 }}>
                <Text style={[ui.eyebrow, { paddingTop: 5 }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={[ui.body, { flex: 1, color: colors.ink }]}>{step}</Text>
              </View>
            ))}
            <Text style={ui.eyebrow}>Explore this sample</Text>
            <View style={ui.row}>
              <Button secondary onPress={() => onFollowUp('Explain')}>
                Explain why
              </Button>
              <Button secondary onPress={() => onFollowUp('Next Step')}>
                Show next step
              </Button>
            </View>
            <Text style={[ui.body, { fontSize: 13 }]}>
              These follow-ups are scripted too. Dismissing clears this temporary answer.
            </Text>
            <View style={ui.row}>
              <Button
                disabled={!state.saveLocally || saved}
                onPress={() => dispatch({ type: 'save', response })}
              >
                {saved ? 'Saved on this device' : 'Save explanation'}
              </Button>
              <Button secondary onPress={onDismiss}>
                Dismiss
              </Button>
            </View>
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
