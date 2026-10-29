import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  AppState,
  Image,
  Modal,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { actions, type TutorAction, type TutorResponse } from '../domain/tutoring';
import { fullCrop, pixelCrop, type Crop } from '../domain/crop';
import { MAX_IMAGE_BYTES, type VisionRequest } from '../../shared/vision';
import { respondToImage } from '../providers/vision';
import { useGatewaySession } from '../state/GatewaySession';
import { useAppState } from '../state/AppState';
import { ImageSelection, type ImportedImage } from './ImageSelection';
import { ResponseSheet } from './ResponseSheet';
import { Button, Card, ui } from './ui';

type Pending = { request: VisionRequest; uri: string };
export function ImportedStudy({ onDemo }: { onDemo: () => void }) {
  const { state } = useAppState();
  const { session } = useGatewaySession();
  const [image, setImage] = useState<ImportedImage | null>(null);
  const [crop, setCrop] = useState<Crop>(fullCrop);
  const [includesWork, setIncludesWork] = useState(true);
  const [pending, setPending] = useState<Pending | null>(null);
  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const version = useRef(0);
  const mounted = useRef(true);
  const pickerVersion = useRef(0);
  const cancel = useCallback(() => {
    version.current++;
    controller.current?.abort();
    setBusy(false);
    setPending(null);
  }, []);
  const dismiss = useCallback(() => {
    cancel();
    setResponse(null);
  }, [cancel]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        cancel();
        if (state.hideOnBackground) setResponse(null);
      }
    });
    return () => listener.remove();
  }, [cancel, state.hideOnBackground]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      version.current++;
      controller.current?.abort();
    };
  }, []);
  useFocusEffect(
    useCallback(
      () => () => {
        version.current++;
        controller.current?.abort();
      },
      [],
    ),
  );
  async function importImage() {
    dismiss();
    setError('');
    const current = ++version.current;
    const picker = ++pickerVersion.current;
    try {
      // System picker: no broad library permission and no camera/microphone request.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled || !mounted.current || picker !== pickerVersion.current) return;
      // The picker itself backgrounds the app; begin a new operation after it returns.
      const chosen = result.assets[0];
      if (
        (chosen.fileSize ?? 0) > 12 * 1024 * 1024 ||
        chosen.width * chosen.height > 36000000 ||
        chosen.width < 1 ||
        chosen.height < 1
      )
        throw new Error('Choose an image under 12 MB and 36 megapixels.');
      version.current = Math.max(version.current, current) + 1;
      const importedVersion = version.current;
      setBusy(true);
      const scale = Math.min(1, 2048 / Math.max(chosen.width, chosen.height));
      const normalized = await manipulateAsync(
        chosen.uri,
        [
          {
            resize: {
              width: Math.round(chosen.width * scale),
              height: Math.round(chosen.height * scale),
            },
          },
        ],
        { format: SaveFormat.JPEG, compress: 0.9 },
      );
      if (importedVersion !== version.current) return;
      setImage(normalized);
      setCrop(fullCrop);
      setIncludesWork(true);
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : 'Unable to import this image.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function prepare(action: TutorAction) {
    if (!image || busy) return;
    if (!session || state.provider !== 'openai') {
      setError(
        'Choose OpenAI and connect your gateway in Settings. Imported notes are never answered by the simulated demo.',
      );
      return;
    }
    const current = ++version.current;
    setBusy(true);
    setError('');
    try {
      const selected = await manipulateAsync(
        image.uri,
        [{ crop: pixelCrop(crop, image.width, image.height) }],
        { format: SaveFormat.JPEG, compress: 0.9, base64: true },
      );
      if (current !== version.current) return;
      if (!selected.base64 || selected.base64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4)
        throw new Error('Crop is too large. Select a smaller area.');
      const previous =
        response && !response.simulated
          ? {
              action: response.action,
              feedback: response.steps,
              nextStep: response.analysis.nextStep,
            }
          : undefined;
      setResponse(null);
      setPending({
        uri: selected.uri,
        request: {
          action,
          includesWork,
          consent: true,
          image: { base64: selected.base64, mime: 'image/jpeg' },
          ...(previous ? { previous } : {}),
        },
      });
    } catch (e) {
      if (current === version.current)
        setError(e instanceof Error ? e.message : 'Unable to prepare selection.');
    } finally {
      if (current === version.current) setBusy(false);
    }
  }
  async function upload() {
    if (!pending || !session || busy) return;
    const request = pending.request;
    setPending(null);
    setBusy(true);
    setError('');
    const current = ++version.current;
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 55000);
    try {
      const result = await respondToImage(session, request, abort.signal);
      if (current === version.current) setResponse(result);
    } catch (e) {
      if (current === version.current)
        setError(
          abort.signal.aborted
            ? 'Request cancelled or timed out. A submitted provider request may still incur charges.'
            : e instanceof Error
              ? e.message
              : 'Analysis failed.',
        );
    } finally {
      clearTimeout(timer);
      if (current === version.current) setBusy(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={ui.page}>
      <Text style={ui.eyebrow}>Continue my work</Text>
      <Text style={ui.title}>Your handwriting. One useful next step.</Text>
      <View style={ui.row}>
        <Button disabled={busy} onPress={() => void importImage()}>
          {image ? 'Replace image' : 'Import screenshot or image'}
        </Button>
        <Button
          secondary
          onPress={() => {
            dismiss();
            onDemo();
          }}
        >
          Use simulated demo
        </Button>
      </View>
      <Text style={ui.body}>
        Images stay local until you review the crop and approve an upload. Include the original
        question and your steps; no typed prompt is needed.
      </Text>
      {image && (
        <Card>
          <ImageSelection
            image={image}
            crop={crop}
            onChange={(value) => {
              dismiss();
              setCrop(value);
            }}
          />
          <View style={ui.row}>
            <Switch
              accessibilityLabel="Include my handwritten work"
              value={includesWork}
              onValueChange={(value) => {
                dismiss();
                setIncludesWork(value);
              }}
            />
            <Text style={ui.body}>This crop includes my handwritten work</Text>
          </View>
          <Text style={ui.body}>
            The toggle describes the crop; only resizing removes content. Keep both the problem and
            working visible for continuation.
          </Text>
          {actions.map((action) => (
            <Button
              key={action}
              disabled={busy || (action === 'Check My Work' && !includesWork)}
              onPress={() => void prepare(action)}
            >
              {action}
            </Button>
          ))}
        </Card>
      )}
      {busy && (
        <View style={ui.row}>
          <ActivityIndicator accessibilityLabel="Analyzing or preparing selection" />
          <Text style={ui.body}>Working…</Text>
          <Button secondary onPress={cancel}>
            Cancel request
          </Button>
        </View>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: '#8D2F24' }}>
          {error}
        </Text>
      )}
      <Modal visible={!!pending} transparent animationType="slide" onRequestClose={cancel}>
        <View
          style={{ flex: 1, justifyContent: 'center', backgroundColor: '#102C3866', padding: 24 }}
        >
          <ScrollView
            style={{ maxHeight: '90%', backgroundColor: 'white', borderRadius: 20 }}
            contentContainerStyle={{ padding: 24, gap: 16 }}
          >
            <Text style={ui.heading}>Review before uploading</Text>
            {pending && (
              <Image
                source={{ uri: pending.uri }}
                style={{ width: '100%', height: 280 }}
                resizeMode="contain"
                accessibilityLabel="Exact image crop to upload"
              />
            )}
            <Text style={ui.body}>
              Send this crop{pending?.request.previous ? ' and previous AI feedback' : ''} to{' '}
              {session?.url} and OpenAI for {pending?.request.action}? This may incur API charges.
              OpenAI retention policies apply. Only proceed with notes you are permitted to share.
            </Text>
            <Text style={ui.body}>
              No automatic upload or server-side image storage. Local image processing may create
              temporary OS cache files.
            </Text>
            <Button onPress={() => void upload()}>Consent and analyze</Button>
            <Button secondary onPress={cancel}>
              Keep on device
            </Button>
          </ScrollView>
        </View>
      </Modal>
      <ResponseSheet
        response={response}
        onDismiss={dismiss}
        onFollowUp={(action) => void prepare(action)}
      />
    </ScrollView>
  );
}
