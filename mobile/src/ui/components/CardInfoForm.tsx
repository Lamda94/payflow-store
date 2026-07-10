import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  goToSummary,
  selectCardDraft,
  selectCustomerEmail,
  setCardField,
  setCustomerEmail,
} from '../../store/slices/checkoutSlice';
import { detectCardBrand } from '../../domain/card/brand';
import {
  expandTwoDigitYear,
  formatCardNumber,
  formatExpiration,
} from '../../domain/card/format';
import { validateCard } from '../../domain/card/validateCard';
import { isValidEmail } from '../../domain/email';
import { LabeledInput } from './LabeledInput';
import { CardBrandLogo } from './CardBrandLogo';
import { QuantityStepper } from './QuantityStepper';
import { colors, spacing, typography } from '../theme';

export function CardInfoForm() {
  const dispatch = useAppDispatch();
  const card = useAppSelector(selectCardDraft);
  const customerEmail = useAppSelector(selectCustomerEmail);

  const brand = detectCardBrand(card.cardNumber);
  const errors = validateCard({
    cardNumber: card.cardNumber,
    holderName: card.holderName,
    expirationMonth: card.expirationMonth,
    expirationYear: card.expirationYear,
    cvc: card.cvc,
  });
  const emailValid = isValidEmail(customerEmail);
  const canContinue = Object.keys(errors).length === 0 && emailValid;

  const expiryDigits =
    card.expirationMonth + (card.expirationYear ? card.expirationYear.slice(-2) : '');

  function handleExpirationChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    const month = digits.slice(0, 2);
    const year = digits.length > 2 ? expandTwoDigitYear(digits.slice(2)) : '';
    dispatch(setCardField({ field: 'expirationMonth', value: month }));
    dispatch(setCardField({ field: 'expirationYear', value: year }));
  }

  return (
    <View testID="card-info-form">
      <Text style={styles.title}>Card details</Text>

      <LabeledInput
        testID="card-number-input"
        label="Card number"
        value={formatCardNumber(card.cardNumber)}
        onChangeText={text =>
          dispatch(
            setCardField({
              field: 'cardNumber',
              value: text.replace(/\D/g, '').slice(0, 19),
            }),
          )
        }
        placeholder="4242 4242 4242 4242"
        keyboardType="number-pad"
        error={errors.cardNumber}
        rightElement={<CardBrandLogo brand={brand} />}
      />

      <LabeledInput
        testID="holder-name-input"
        label="Cardholder name"
        value={card.holderName}
        onChangeText={text => dispatch(setCardField({ field: 'holderName', value: text }))}
        placeholder="JOHN DOE"
        autoCapitalize="characters"
        error={errors.holderName}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <LabeledInput
            testID="expiration-input"
            label="Expiration (MM/YY)"
            value={formatExpiration(expiryDigits)}
            onChangeText={handleExpirationChange}
            placeholder="MM/YY"
            keyboardType="number-pad"
            maxLength={5}
            error={errors.expirationMonth ?? errors.expirationYear}
          />
        </View>
        <View style={styles.rowItem}>
          <LabeledInput
            testID="cvc-input"
            label="CVC"
            value={card.cvc}
            onChangeText={text =>
              dispatch(
                setCardField({ field: 'cvc', value: text.replace(/\D/g, '').slice(0, 4) }),
              )
            }
            placeholder="123"
            keyboardType="number-pad"
            maxLength={4}
            error={errors.cvc}
          />
        </View>
      </View>

      <LabeledInput
        testID="email-input"
        label="Email"
        value={customerEmail}
        onChangeText={text => dispatch(setCustomerEmail(text))}
        placeholder="you@example.com"
        keyboardType="email-address"
        error={customerEmail.length > 0 && !emailValid ? 'Enter a valid email' : undefined}
      />

      <View style={styles.installmentsRow}>
        <Text style={styles.label}>Installments</Text>
        <QuantityStepper
          quantity={card.installments}
          max={36}
          onChange={value => dispatch(setCardField({ field: 'installments', value }))}
        />
      </View>

      <Pressable
        testID="continue-button"
        disabled={!canContinue}
        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        onPress={() => dispatch(goToSummary())}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  installmentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    ...typography.subtitle,
    color: colors.background,
    fontWeight: '700',
  },
});
