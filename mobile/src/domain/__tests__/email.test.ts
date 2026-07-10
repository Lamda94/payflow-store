import { isValidEmail } from '../email';

describe('isValidEmail', () => {
  it.each(['a@b.com', 'john.doe@example.co', 'a+tag@sub.example.com'])(
    'accepts %s',
    value => {
      expect(isValidEmail(value)).toBe(true);
    },
  );

  it.each(['', 'not-an-email', 'a@b', '@b.com', 'a@.com', 'a b@c.com'])(
    'rejects %s',
    value => {
      expect(isValidEmail(value)).toBe(false);
    },
  );
});
