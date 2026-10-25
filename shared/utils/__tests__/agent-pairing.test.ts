// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  agentCompanionUrl,
  parseAgentPairing,
  stripAgentPairing,
} from '../agent';

const TOKEN = 'aB3_dE5-gH7jK9mN1pQ3rS5t';

describe('parseAgentPairing', () => {
  it('reads token and port from the fragment', () => {
    expect(parseAgentPairing(`#geins-agent=${TOKEN}:4317`)).toEqual({
      token: TOKEN,
      port: 4317,
    });
  });

  it('ignores other fragment parameters', () => {
    expect(parseAgentPairing(`#tab=2&geins-agent=${TOKEN}:51000`)?.port).toBe(
      51000,
    );
  });

  it('rejects malformed pairings', () => {
    expect(parseAgentPairing('')).toBeUndefined();
    expect(parseAgentPairing('#geins-agent=short:4317')).toBeUndefined();
    expect(parseAgentPairing(`#geins-agent=${TOKEN}`)).toBeUndefined();
    expect(parseAgentPairing(`#geins-agent=${TOKEN}:0`)).toBeUndefined();
    expect(parseAgentPairing(`#geins-agent=${TOKEN}:99999`)).toBeUndefined();
    expect(
      parseAgentPairing(`#geins-agent=${TOKEN}<script>:4317`),
    ).toBeUndefined();
  });
});

describe('stripAgentPairing', () => {
  it('removes only the pairing parameter', () => {
    expect(stripAgentPairing(`#geins-agent=${TOKEN}:4317`)).toBe('');
    expect(stripAgentPairing(`#tab=2&geins-agent=${TOKEN}:4317`)).toBe(
      '#tab=2',
    );
  });
});

describe('agentCompanionUrl', () => {
  it('points at the local helper with the token', () => {
    expect(agentCompanionUrl({ token: TOKEN, port: 4317 })).toBe(
      `ws://127.0.0.1:4317/agent?token=${TOKEN}`,
    );
  });
});
