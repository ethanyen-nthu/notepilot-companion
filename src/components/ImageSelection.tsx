import { useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { cropFromPoints, fullCrop, resizeCrop, type Crop } from '../domain/crop';
import { Button, colors, ui } from './ui';
export type ImportedImage = { uri: string; width: number; height: number };
export function ImageSelection({
  image,
  crop,
  onChange,
}: {
  image: ImportedImage;
  crop: Crop;
  onChange: (crop: Crop) => void;
}) {
  const [width, setWidth] = useState(1);
  const height = (width * image.height) / image.width;
  const start = useRef({ x: 0, y: 0 });
  return (
    <View style={{ gap: 12 }}>
      <Text style={ui.body}>
        Drag across the image to select a rectangle. Include the question and your working.
        Fine-tune any edge below.
      </Text>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{
          width: '100%',
          aspectRatio: image.width / image.height,
          backgroundColor: colors.paper,
        }}
        accessibilityLabel="Image crop surface"
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          start.current = {
            x: event.nativeEvent.locationX / width,
            y: event.nativeEvent.locationY / height,
          };
        }}
        onResponderMove={(event) =>
          onChange(
            cropFromPoints(start.current, {
              x: event.nativeEvent.locationX / width,
              y: event.nativeEvent.locationY / height,
            }),
          )
        }
        onResponderTerminationRequest={() => false}
      >
        <Image
          pointerEvents="none"
          source={{ uri: image.uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          accessibilityLabel="Imported handwritten question"
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: crop.x * width,
            top: crop.y * height,
            width: crop.width * width,
            height: crop.height * height,
            borderWidth: 3,
            borderColor: colors.accent,
            backgroundColor: '#24796B18',
          }}
        />
      </View>
      <Text accessibilityLiveRegion="polite" style={ui.eyebrow}>
        Selection: {Math.round(crop.width * 100)}% wide × {Math.round(crop.height * 100)}% high
      </Text>
      {(['left', 'right', 'top', 'bottom'] as const).map((edge) => (
        <View key={edge} style={ui.row}>
          <Text style={[ui.body, { width: 70 }]}>{edge}</Text>
          <Button
            secondary
            accessibilityLabel={`Move ${edge} edge backward`}
            onPress={() => onChange(resizeCrop(crop, edge, -0.025))}
          >
            −
          </Button>
          <Button
            secondary
            accessibilityLabel={`Move ${edge} edge forward`}
            onPress={() => onChange(resizeCrop(crop, edge, 0.025))}
          >
            +
          </Button>
        </View>
      ))}
      <Button secondary onPress={() => onChange(fullCrop)}>
        Select whole image
      </Button>
    </View>
  );
}
