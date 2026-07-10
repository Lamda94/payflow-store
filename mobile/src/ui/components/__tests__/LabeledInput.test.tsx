import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { LabeledInput } from '../LabeledInput';

describe('LabeledInput', () => {
  it('renders the label and calls onChangeText', async () => {
    const onChangeText = jest.fn();
    const { getByText, getByTestId } = await render(
      <LabeledInput
        testID="field"
        label="Email"
        value=""
        onChangeText={onChangeText}
      />,
    );

    expect(getByText('Email')).toBeTruthy();
    fireEvent.changeText(getByTestId('field'), 'a@b.com');
    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the error message when provided', async () => {
    const { getByTestId } = await render(
      <LabeledInput testID="field" label="Email" value="" onChangeText={jest.fn()} error="Required" />,
    );
    expect(getByTestId('field-error').props.children).toBe('Required');
  });

  it('renders no error text when none is provided', async () => {
    const { queryByTestId } = await render(
      <LabeledInput testID="field" label="Email" value="" onChangeText={jest.fn()} />,
    );
    expect(queryByTestId('field-error')).toBeNull();
  });

  it('renders an optional rightElement', async () => {
    const { getByText } = await render(
      <LabeledInput
        testID="field"
        label="Card"
        value=""
        onChangeText={jest.fn()}
        rightElement={<Text>BADGE</Text>}
      />,
    );
    expect(getByText('BADGE')).toBeTruthy();
  });
});
