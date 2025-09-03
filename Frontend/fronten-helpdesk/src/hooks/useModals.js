
import { useState } from 'react';

export const useModals = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showSuccess = (message) => {
    setModalMessage(message);
    setShowSuccessModal(true);
  };

  const showError = (message) => {
    setModalMessage(message);
    setShowErrorModal(true);
  };

  const closeSuccess = () => {
    setShowSuccessModal(false);
  };

  const closeError = () => {
    setShowErrorModal(false);
  };

  return {
    showSuccessModal,
    showErrorModal,
    modalMessage,
    showSuccess,
    showError,
    closeSuccess,
    closeError
  };
};