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
          <DemoBadge />
          <Text style={ui.heading}>
            {item.action} · {examples[item.exampleId].question}
          </Text>
          {item.steps.map((step, index) => (
            <Text style={ui.body} key={index}>
              {step}
            </Text>
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
