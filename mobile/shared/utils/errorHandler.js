import { Alert } from 'react-native';

export const getErrorMessage = (error) => {
  // Handle axios errors
  if (error.response) {
    const { data, status } = error.response;

    // Handle specific status codes
    switch (status) {
      case 400:
        return data?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return data?.message || 'The requested resource was not found.';
      case 409:
        return data?.message || 'A conflict occurred. The resource may already exist.';
      case 422:
        return data?.message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data?.message || 'An error occurred. Please try again.';
    }
  }

  // Handle network errors
  if (error.message === 'Network Error') {
    return 'Unable to connect. Please check your internet connection.';
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  // Handle other errors
  return error.message || 'An unexpected error occurred.';
};

export const showErrorAlert = (error, title = 'Error') => {
  const message = getErrorMessage(error);
  Alert.alert(title, message, [{ text: 'OK' }]);
};

export const showConfirmAlert = (title, message, onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Confirm',
        onPress: onConfirm
      }
    ],
    { cancelable: true }
  );
};

export const showSuccessAlert = (message, title = 'Success', onOk) => {
  Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
};

export default {
  getErrorMessage,
  showErrorAlert,
  showConfirmAlert,
  showSuccessAlert
};
