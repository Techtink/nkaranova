import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

export function useApi(apiCall) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiCall(...args);
        setData(response.data.data || response.data);
        return response.data;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData
  };
}

export function useApiMutation(apiCall) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        const response = await apiCall(...args);
        setSuccess(true);
        return response.data;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    success,
    execute,
    reset
  };
}

export default useApi;
