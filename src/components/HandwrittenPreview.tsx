import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import { examples, type ExampleId, type Selection } from '../domain/tutoring';
import { colors, ui } from './ui';
// Original synthetic pen paths. No downloaded notes, fonts, OCR, or student data.
const glyphs: Record<string, string> = {
  '0': 'M15 3 C-1 1 -2 29 10 30 C24 33 28 0 15 3',
  '1': 'M5 10 L14 3 L12 30 M5 30 L21 30',
  '2': 'M2 9 C5 -4 27 1 20 13 Q16 20 2 29 L24 29',
  '3': 'M3 4 Q25 -2 20 11 L11 15 Q29 14 22 25 Q15 35 2 27',
  '5': 'M24 3 L5 3 L4 15 Q29 8 22 25 Q16 34 2 27',
  '6': 'M22 3 Q4 1 3 22 C3 37 25 32 23 21 Q20 11 4 18',
  '7': 'M2 4 L25 3 L9 30',
  '9': 'M23 16 C-1 27 -2 -2 17 3 Q30 7 14 30',
  x: 'M3 7 L23 29 M24 6 L2 30',
  '+': 'M3 17 L25 17 M14 6 L14 28',
  '-': 'M3 17 L25 17',
  '=': 'M3 12 L25 12 M3 22 L25 22',
  '(': 'M18 0 Q0 16 15 33',
  ')': 'M6 0 Q25 16 8 33',
  ',': 'M12 26 L7 35',
};
function Ink({ value }: { value: string }) {
  return (
    <Svg
      width="100%"
      height={56}
      viewBox={`0 0 ${Math.max(value.length * 30, 300)} 42`}
      accessible={false}
    >
      {Array.from(value).map((char, index) => (
        <G key={index} transform={`translate(${index * 30},2) rotate(${index % 2 ? -2 : 1})`}>
          <Path
            d={char === '²' ? glyphs['2'] : (glyphs[char] ?? '')}
            transform={char === '²' ? 'translate(0,-1) scale(0.55)' : undefined}
            stroke="#244656"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      ))}
    </Svg>
  );
}
export function HandwrittenPreview({
  exampleId,
  selection,
  onSelect,
}: {
  exampleId: ExampleId;
  selection: Selection;
  onSelect: (value: Selection) => void;
}) {
  const example = examples[exampleId];
  return (
    <View style={styles.paper}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" accessible={false}>
        <Defs>
          <Pattern id="paperDots" width="24" height="24" patternUnits="userSpaceOnUse">
            <Circle cx="12" cy="12" r="0.7" fill="#CAD7CF" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#paperDots)" />
      </Svg>
      <View style={ui.row}>
        <Text style={[ui.eyebrow, { flex: 1 }]}>Synthetic study page</Text>
        <Text style={styles.pageNo}>01 / ALGEBRA</Text>
      </View>
      <Text style={[ui.heading, { marginTop: 30 }]}>Find the value of x</Text>
      <Text style={ui.body}>Tap the question or include the working below.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select question: ${example.question}`}
        accessibilityState={{ selected: !!selection }}
        onPress={() => onSelect('question')}
        style={[styles.region, selection && styles.selected]}
      >
        <Ink value={example.question} />
        {!!selection && <Text style={styles.tag}>QUESTION SELECTED</Text>}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select question and sample work"
        accessibilityState={{ selected: selection === 'question-and-work' }}
        onPress={() => onSelect('question-and-work')}
        style={[styles.region, selection === 'question-and-work' && styles.selected]}
      >
        <Text style={styles.workLabel}>Sample student’s working</Text>
        {example.work.map((line) => (
          <Ink key={line} value={line} />
        ))}
        {selection === 'question-and-work' && <Text style={styles.tag}>WORK INCLUDED</Text>}
      </Pressable>
      <Text style={[ui.body, { fontSize: 13, marginTop: 20 }]}>
        A local illustration, not a live view of another app.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  paper: {
    padding: 28,
    backgroundColor: colors.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
    overflow: 'hidden',
  },
  pageNo: { color: colors.muted, fontSize: 10, letterSpacing: 1 },
  region: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 10,
    minHeight: 100,
  },
  selected: { borderColor: '#369D83', backgroundColor: '#E0F1E68F', borderStyle: 'dashed' },
  tag: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  workLabel: { color: colors.muted, fontSize: 13, marginBottom: 2 },
});
