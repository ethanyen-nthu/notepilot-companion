import { MathText } from '../components/MathText';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, DemoBadge, ui } from '../components/ui';
import { examples } from '../domain/tutoring';
import { useAppState } from '../state/AppState';
export default function SavedScreen() {
  const { state, dispatch } = useAppState();
  return (
    <ScrollView contentContainerStyle={ui.page}>
      <Text style={ui.eyebrow}>Keep the useful bits</Text>
      <Text accessibilityRole="header" style={ui.title}>
        Saved explanations
      </Text>
      <Text style={ui.body}>
        Only what you explicitly save. Stored on this device, up to 50 explanations.
      </Text>
      {!state.saved.length && (
        <Card>
          <Text style={ui.heading}>A little collection of clarity.</Text>
          <Text style={ui.body}>
            Save an explanation from your study space and it will appear here. Nothing is saved
            automatically.
          </Text>
        </Card>
      )}
      {state.saved.map((item) => (
        <Card key={item.id}>
          {item.simulated ? (
            <DemoBadge />
          ) : (
            <Text style={ui.eyebrow}>OpenAI � AI-generated, verify the reasoning</Text>
          )}
          <Text style={ui.heading}>
            {item.action} ·{' '}
            {item.simulated ? examples[item.exampleId].question : 'Imported handwriting'}
          </Text>
          {!item.simulated && (
            <Text style={ui.body}>
              Recognition: {item.analysis.reading}. {item.analysis.uncertainty.join(' ')}
            </Text>
          )}
          {item.steps.map((step, index) => (
            <MathText key={index} text={step} />
          ))}
          <View style={ui.row}>
            <Button
              secondary
              onPress={() => dispatch({ type: 'remove', id: item.id })}
              accessibilityLabel={`Remove ${item.action} explanation`}
            >
              Remove
            </Button>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
