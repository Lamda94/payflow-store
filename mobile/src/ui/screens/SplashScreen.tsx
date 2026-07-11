import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/** Long enough for the intro animation to land before leaving. */
export const SPLASH_DURATION_MS = 2000;

export function SplashScreen({ navigation }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.4)).current;
  // -1 maps to -25deg (see interpolation below); settles at 0deg.
  const logoTilt = useRef(new Animated.Value(-1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleShift = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. logo pops in with a spring while it straightens up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(logoTilt, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // 2. a pulse ring radiates out while the texts cascade in
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(ringScale, {
              toValue: 1.7,
              duration: 480,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 480,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.stagger(140, [
          Animated.parallel([
            Animated.timing(titleOpacity, {
              toValue: 1,
              duration: 380,
              useNativeDriver: true,
            }),
            Animated.timing(titleShift, {
              toValue: 0,
              duration: 380,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [
    logoOpacity,
    logoScale,
    logoTilt,
    ringOpacity,
    ringScale,
    titleOpacity,
    titleShift,
    taglineOpacity,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Home'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  const logoRotation = logoTilt.interpolate({
    inputRange: [-1, 0],
    outputRange: ['-25deg', '0deg'],
  });

  return (
    <View style={styles.container} testID="splash-screen">
      <View style={styles.logoStage}>
        <Animated.View
          style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        <Animated.Image
          testID="splash-logo"
          source={require('../assets/logo.png')}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate: logoRotation }],
            },
          ]}
        />
      </View>
      <Animated.Text
        style={[
          styles.title,
          { opacity: titleOpacity, transform: [{ translateY: titleShift }] },
        ]}
      >
        PayFlow Store
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Checkout made simple
      </Animated.Text>
    </View>
  );
}

const RING_SIZE = 176;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  logoStage: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
