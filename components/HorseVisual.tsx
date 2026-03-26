import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Mode = 'hero' | 'card' | 'track';

function shift(hex: string, amount: number) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function HorseVisual({
  color,
  size = 120,
  mode = 'card',
  label,
}: {
  color: string;
  size?: number;
  mode?: Mode;
  label?: string;
}) {
  const inner = mode === 'hero' ? size * 0.72 : mode === 'track' ? size * 0.6 : size * 0.64;

  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: mode === 'track' ? size * 0.74 : size,
          borderRadius: mode === 'track' ? 16 : 24,
        },
      ]}
    >
      <LinearGradient
        colors={['#101827', '#162235']}
        style={[styles.panel, { borderRadius: mode === 'track' ? 16 : 24 }]}
      >
        <View style={[styles.glow, { backgroundColor: `${shift(color, 35)}33` }]} />
        <LinearGradient
          colors={[shift(color, 30), color, shift(color, -45)]}
          style={[styles.coin, { width: inner, height: inner, borderRadius: inner / 2 }]}
        >
          <MaterialCommunityIcons
            name={mode === 'track' ? 'horse-variant-fast' : 'horse-variant'}
            size={inner * 0.5}
            color="#fff7ed"
          />
        </LinearGradient>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { overflow: 'hidden' },
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#22324b',
  },
  glow: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    top: '10%',
    borderRadius: 999,
  },
  coin: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff22',
  },
  label: {
    position: 'absolute',
    bottom: 10,
    color: '#dbe4f0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
