import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { mathParts } from '../domain/math';
import { ui } from './ui';
export function MathText({ text }: { text: string }) {
  return (
    <View style={{ gap: 4, flex: 1 }}>
      {mathParts(text).map((part, i) =>
        part.html ? (
          <View key={i} style={{ height: 100 }} accessibilityLabel={part.source}>
            <WebView
              javaScriptEnabled={false}
              domStorageEnabled={false}
              originWhitelist={['about:blank']}
              onShouldStartLoadWithRequest={(r) => r.url === 'about:blank'}
              source={{
                html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"></head><body style="font-size:21px;margin:8px;color:#173B36">${part.html}</body></html>`,
              }}
            />
          </View>
        ) : (
          <Text key={i} style={ui.body}>
            {part.source}
          </Text>
        ),
      )}
    </View>
  );
}
