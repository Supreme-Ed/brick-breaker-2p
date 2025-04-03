const { Paddle } = require('../../js/entities/paddle_entity.js');

describe('Paddle Import Test', () => {
  test('should import Paddle without error', () => {
    expect(Paddle).toBeDefined();
  });
});
