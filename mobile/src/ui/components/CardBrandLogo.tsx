import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CardBrand } from '../../domain/card/types';

interface Props {
  brand: CardBrand;
}

export function CardBrandLogo({ brand }: Props) {
  if (brand === 'visa') {
    return (
      <Text style={styles.visaText} testID="brand-logo-visa">
        VISA
      </Text>
    );
  }

  if (brand === 'mastercard') {
    return (
      <View style={styles.mastercardContainer} testID="brand-logo-mastercard">
        <View style={[styles.circle, styles.circleRed]} />
        <View style={[styles.circle, styles.circleYellow, styles.circleOverlap]} />
      </View>
    );
  }

  return null;
}

const CIRCLE_SIZE = 18;

const styles = StyleSheet.create({
  visaText: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#1a1f71',
    letterSpacing: 1,
  },
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  circleRed: {
    backgroundColor: '#eb001b',
  },
  circleYellow: {
    backgroundColor: '#f79e1b',
    opacity: 0.85,
  },
  circleOverlap: {
    marginLeft: -CIRCLE_SIZE / 2,
  },
});
