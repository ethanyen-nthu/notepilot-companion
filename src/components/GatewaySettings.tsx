import { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { checkGateway, gatewayUrl } from '../providers/vision';
import { useGatewaySession } from '../state/GatewaySession';
import { Button, Card, ui } from './ui';
export function GatewaySettings() {
  const { session, connect } = useGatewaySession();
  const [url, setUrl] = useState(session?.url ?? '');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function connectGateway() {
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 10000);
    setBusy(true);
    setMessage('Checking gateway configuration…');
    try {
      if (token.length < 32 || token.startsWith('sk-'))
        throw new Error('Enter the gateway access token, not your OpenAI API key.');
      const next = { url: gatewayUrl(url), token };
      await checkGateway(next, abort.signal);
      if (abort.signal.aborted) return;
      connect(next);
      setToken('');
      setMessage('Connected. Every image upload still requires your consent.');
    } catch (e) {
      setMessage(
        abort.signal.aborted
          ? 'Connection timed out or was cancelled.'
          : e instanceof Error
            ? e.message
            : 'Unable to connect.',
      );
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  return (
    <Card>
      <Text style={ui.heading}>Personal AI gateway</Text>
      <Text style={ui.body}>
        Enter your trusted gateway origin and its access token. Keep your OpenAI key on the server.
        The connection stays in memory until the app restarts.
      </Text>
      <TextInput
        accessibilityLabel="Gateway URL"
        placeholder="https://your-gateway.example"
        autoCapitalize="none"
        autoCorrect={false}
        value={url}
        onChangeText={setUrl}
        style={[ui.body, { borderWidth: 1, padding: 12, borderRadius: 8 }]}
      />
      <TextInput
        accessibilityLabel="Gateway access token"
        placeholder="Gateway access token (not an OpenAI key)"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
        style={[ui.body, { borderWidth: 1, padding: 12, borderRadius: 8 }]}
      />
      <Button disabled={busy} onPress={() => void connectGateway()}>
        {busy ? 'Connecting…' : 'Connect gateway'}
      </Button>
      {session && (
        <Button
          secondary
          onPress={() => {
            controller.current?.abort();
            connect(null);
            setToken('');
            setMessage('Disconnected.');
          }}
        >
          Disconnect gateway
        </Button>
      )}
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={ui.body}>
          {message}
        </Text>
      )}
    </Card>
  );
}
