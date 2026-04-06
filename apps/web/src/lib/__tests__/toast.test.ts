import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => {
  const success = vi.fn();
  const error = vi.fn();
  const loading = vi.fn();
  const dismiss = vi.fn();
  const promise = vi.fn();
  const toastFn = vi.fn() as ReturnType<typeof vi.fn> & {
    success: typeof success;
    error: typeof error;
    loading: typeof loading;
    dismiss: typeof dismiss;
    promise: typeof promise;
  };
  toastFn.success = success;
  toastFn.error = error;
  toastFn.loading = loading;
  toastFn.dismiss = dismiss;
  toastFn.promise = promise;
  return { toast: toastFn };
});

import { showToast } from '../toast';
import { toast } from 'sonner';

describe('showToast', () => {
  it('calls toast.success with message', () => {
    showToast.success('Done');
    expect(toast.success).toHaveBeenCalledWith('Done');
  });

  it('calls toast.error with message', () => {
    showToast.error('Failed');
    expect(toast.error).toHaveBeenCalledWith('Failed');
  });

  it('calls toast (info) with message', () => {
    showToast.info('Info');
    expect(toast).toHaveBeenCalledWith('Info');
  });

  it('calls toast.loading with message', () => {
    showToast.loading('Loading...');
    expect(toast.loading).toHaveBeenCalledWith('Loading...');
  });

  it('calls toast.dismiss with id', () => {
    showToast.dismiss(42);
    expect(toast.dismiss).toHaveBeenCalledWith(42);
  });

  it('calls toast.dismiss without id', () => {
    showToast.dismiss();
    expect(toast.dismiss).toHaveBeenCalledWith(undefined);
  });

  it('calls toast.promise with promise and messages', () => {
    const p = Promise.resolve('ok');
    const msgs = { loading: 'L', success: 'S', error: 'E' };
    showToast.promise(p, msgs);
    expect(toast.promise).toHaveBeenCalledWith(p, msgs);
  });
});
