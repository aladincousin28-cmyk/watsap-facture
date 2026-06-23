import React, { useRef, useEffect, useCallback } from 'react';
import { View, Animated, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const DURATION = 2500;

let showToastFn = null;

export function showToast(message, type = 'success') {
  if (showToastFn) showToastFn(message, type);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = React.useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const show = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    opacity.setValue(0);
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, DURATION);
  }, [opacity]);

  useEffect(() => { showToastFn = show; return () => { showToastFn = null; }; }, [show]);

  const iconMap = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' };
  const colorMap = { success: COLORS.green, error: COLORS.red, info: COLORS.gold };
  const iconBgMap = { success: COLORS.greenBg, error: COLORS.redBg, info: COLORS.cardBorder };

  return (
    <>
      {children}
      {toast && (
        <Animated.View style={[styles.container, { opacity }]}>
          <Animated.View style={[styles.toast, { borderLeftColor: colorMap[toast.type], backgroundColor: COLORS.card }]}>
            <View style={[styles.iconWrap, { backgroundColor: iconBgMap[toast.type] }]}>
              <Ionicons name={iconMap[toast.type]} size={18} color={colorMap[toast.type]} />
            </View>
            <Text style={styles.text} numberOfLines={2}>{toast.message}</Text>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 10,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { flex: 1, color: COLORS.white, fontSize: 13, fontWeight: '500' },
});
