import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors, spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Material "Backdrop": the back layer (whatever screen is behind) stays
 * dimmed and visible; the front layer is a rounded sheet that slides up
 * from the bottom holding the active step's content (card form, then
 * summary). Dismissible by tapping the scrim or the Android back button.
 *
 * Wrapped in KeyboardAvoidingView because RN's Modal opens its own native
 * window on Android, which doesn't inherit the host Activity's
 * windowSoftInputMode resize behavior — without this, the keyboard simply
 * covers whatever input is focused instead of the sheet shrinking to make
 * room for it.
 */
export function Backdrop({ visible, onClose, children }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="backdrop-modal"
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityLabel="Close"
          testID="backdrop-scrim"
        />
        <View style={styles.sheet} testID="backdrop-sheet">
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
});
