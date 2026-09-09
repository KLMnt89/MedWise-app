import { useCallback, useState } from 'react';

export async function withMinDuration(promise, ms) {
  const [result] = await Promise.all([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
  return result;
}

export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (task) => {
    setLoading(true);
    setError(null);
    try {
      return await task();
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, run };
}
