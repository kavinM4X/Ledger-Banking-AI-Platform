import axios from 'axios';

const API_BASE_URL = 'https://ledger-banking-ai-platform-1.onrender.com/api/collections';

export const fetchCustomerAndLoans = async (customerId) => {
  const response = await axios.get(`${API_BASE_URL}/customer/${customerId}`);
  return response.data;
};

export const generateCallScript = async (customerId, loanId) => {
  const response = await axios.post(`${API_BASE_URL}/generate`, { customerId, loanId });
  return response.data;
};

