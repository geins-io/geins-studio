// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import type { ExecutionError } from '#shared/types';

mockNuxtImport('useExecutionStatus', () => () => ({
  isFailedStatus: (status?: string | null) =>
    ['failed', 'timedout'].includes(status?.toLowerCase() ?? ''),
}));

import { useExecutionErrors } from '../orchestrator/useExecutionErrors';

const {
  executionErrors,
  errorForNode,
  nodeErrorMessage,
  childFailure,
  errorCode,
} = useExecutionErrors();

const httpError: ExecutionError = {
  message: 'HTTP 503 Service Unavailable',
  type: 'HttpRequestException',
  failedNodeId: 'step-2',
  failedNodeName: 'Call external API',
  timestamp: '2026-10-12T10:00:00Z',
};

describe('useExecutionErrors', () => {
  describe('executionErrors', () => {
    it('returns an empty list without an execution', () => {
      expect(executionErrors(null)).toEqual([]);
      expect(executionErrors({})).toEqual([]);
    });

    it('puts the primary error first and dedupes it from errors[]', () => {
      const other: ExecutionError = {
        message: 'Timeout',
        failedNodeId: 'step-4',
      };
      expect(
        executionErrors({ error: httpError, errors: [httpError, other] }),
      ).toEqual([httpError, other]);
    });

    it('keeps repeated failures beyond the primary error', () => {
      expect(
        executionErrors({ error: httpError, errors: [httpError, httpError] }),
      ).toEqual([httpError, httpError]);
    });

    it('accepts plain string errors from older executions', () => {
      expect(
        executionErrors(JSON.parse('{"error":"Boom","errors":["Boom", 42]}')),
      ).toEqual([{ message: 'Boom' }]);
    });
  });

  describe('errorForNode', () => {
    it("prefers the node's own error", () => {
      const own: ExecutionError = { message: 'Node error' };
      expect(
        errorForNode({ error: httpError }, { nodeId: 'step-2', error: own }),
      ).toBe(own);
    });

    it('falls back to the execution error naming a failed node', () => {
      expect(
        errorForNode(
          { error: httpError },
          { nodeId: 'step-2', status: 'Failed' },
        ),
      ).toBe(httpError);
      expect(
        errorForNode(
          { error: httpError },
          { nodeId: 'step-3', status: 'failed' },
        ),
      ).toBe(null);
    });

    it('does not attach the execution error to a node that succeeded', () => {
      expect(
        errorForNode(
          { error: httpError },
          { nodeId: 'step-2', status: 'completed' },
        ),
      ).toBe(null);
    });
  });

  describe('nodeErrorMessage', () => {
    it('reads the message from the node error object', () => {
      expect(nodeErrorMessage({ error: { message: '401 Unauthorized' } })).toBe(
        '401 Unauthorized',
      );
    });

    it('falls back to the last retry error of a failed node', () => {
      expect(
        nodeErrorMessage({
          status: 'failed',
          retryErrors: ['Connection timeout', '503'],
        }),
      ).toBe('503');
    });

    it('ignores retry errors of a node that recovered', () => {
      expect(
        nodeErrorMessage({ status: 'completed', retryErrors: ['503'] }),
      ).toBe(null);
    });

    it('uses the execution error when the failed node has none', () => {
      expect(
        nodeErrorMessage(
          { nodeId: 'step-2', status: 'failed' },
          { error: httpError },
        ),
      ).toBe(httpError.message);
    });

    it('returns null when nothing is recorded', () => {
      expect(nodeErrorMessage({ nodeId: 'step-1' }, null)).toBe(null);
      expect(nodeErrorMessage(null)).toBe(null);
    });
  });

  describe('childFailure', () => {
    it('reads child workflow context', () => {
      expect(
        childFailure({
          message: "Child workflow 'Sync' failed",
          type: 'ChildWorkflowFailure',
          context: {
            childInstanceId: 'sub-7c0f9d8e',
            childWorkflowId: 'wf-1',
            childFailedNodeId: 'post',
            childFailedNodeName: 'POST product',
            childErrorMessage: '401 Unauthorized',
            childErrorType: 'HttpRequestException',
          },
        }),
      ).toEqual({
        instanceId: 'sub-7c0f9d8e',
        workflowId: 'wf-1',
        nodeName: 'POST product',
        message: '401 Unauthorized',
        type: 'HttpRequestException',
      });
    });

    it('returns null without child context', () => {
      expect(childFailure(httpError)).toBe(null);
      expect(childFailure({ message: 'x', context: { code: 'E1' } })).toBe(
        null,
      );
    });
  });

  describe('errorCode', () => {
    it('reads the Fail node code, then a child error code', () => {
      expect(errorCode({ message: 'x', context: { code: 'E1' } })).toBe('E1');
      expect(
        errorCode({ message: 'x', context: { childErrorCode: 'E2' } }),
      ).toBe('E2');
      expect(errorCode(httpError)).toBe(null);
    });
  });
});
