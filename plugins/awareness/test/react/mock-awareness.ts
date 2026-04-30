import type { PresenceProvider } from '@annotorious/core';

const MockCollaborator = {
  presenceKey: '1',
  appearance: {
    label: 'Rainer',
    color: '#00cc00'
  }
}

const createMockAwareness = () => {

  const handlers: Function[] = [];

  const provider: PresenceProvider = {
    on: function (_, callback) {
      handlers.push(callback);
    }
  }

  const select = (selected?: string) => {
    handlers.forEach(callback => {
      callback(MockCollaborator, selected ? [selected] : []);
    });
  }

  return { select, provider };
}

export const MockAwareness = createMockAwareness();

