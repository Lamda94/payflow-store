import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isDouble = !isDouble;
  }
  return sum % 10 === 0;
}

export function IsLuhnValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLuhnValid',
      target: (object as { constructor: new (...args: unknown[]) => unknown })
        .constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && luhnCheck(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid card number (Luhn check failed)`;
        },
      },
    });
  };
}
