import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { getColors } from '../theme';

export default function LoadingCard({ width = '100%', height = 80 }) {
  const C = getColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[ss.skeleton, { backgroundColor: C.card, borderRadius: 12, marginBottom: 10, width, height, opacity }]} />
  );
}

const ss = StyleSheet.create({
  skeleton: {},
});
