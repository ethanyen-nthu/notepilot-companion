import { Text, View } from 'react-native';
import { mathParts } from '../domain/math';
import { ui } from './ui';
export function MathText({ text }: { text: string }) {
  return (
    <View style={{ gap: 4, flex: 1 }}>
      {mathParts(text).map((part, i) =>
        part.html ? (
          <div
            key={i}
            aria-label={part.source}
            style={{ fontSize: 21, overflowX: 'auto', padding: 8 }}
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        ) : (
          <Text key={i} style={ui.body}>
            {part.source}
          </Text>
        ),
      )}
    </View>
  );
}
