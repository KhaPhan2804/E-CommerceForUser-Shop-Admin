// payosApi.js

import { getJwtToken} from '../database/supabase'; 

const EDGE_FUNCTION_URL = "https://njulzxtvzglbrsxdgbcq.supabase.co/functions/v1/paymentOS";

const EDGE_FUNCTION_CANCEL_URL = "https://njulzxtvzglbrsxdgbcq.supabase.co/functions/v1/cancelOS"; 

const EDGE_FUNCTION_INFO_URL = "https://njulzxtvzglbrsxdgbcq.supabase.co/functions/v1/getOS";

export const createPaymentLink = async (paymentData) => {
  try {
    // Get JWT token
    const jwtToken = await getJwtToken();   

    if (!jwtToken) {
      throw new Error("JWT Token is missing or invalid");
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`, 
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error response from server:", data);
      throw new Error(data.error || 'Unknown error from Edge Function');
    }

    return data;
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw error;
  }
};


export const cancelPayment = async (paymentId, cancellationReason) => {
  try {
    // Get JWT token
    const jwtToken = await getJwtToken();   

    if (!jwtToken) {
      throw new Error("JWT Token is missing or invalid");
    }

    // Prepare the data to send to the edge function
    const cancelPaymentData = {
      paymentId: paymentId,
      cancellationReason: cancellationReason,
    };

    // Call the edge function to cancel payment
    const response = await fetch(EDGE_FUNCTION_CANCEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`, // Include JWT token for authentication
      },
      body: JSON.stringify(cancelPaymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error response from server:", data);
      throw new Error(data.error || 'Unknown error from Edge Function');
    }

    return data; // Return the response data from the cancellation API

  } catch (error) {
    console.error("Error cancelling payment:", error);
    throw error; // Throw the error to handle it in your UI
  }
};

export const getPaymentInfo = async (paymentId) => {
  try {
    const jwtToken = await getJwtToken();

    if (!jwtToken) {
      throw new Error("JWT Token is missing or invalid");
    }

    const response = await fetch(`${EDGE_FUNCTION_INFO_URL}/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error response from server:", data);
      throw new Error(data.error || 'Unknown error fetching payment info');
    }

    return data;
  } catch (error) {
    console.error("Error fetching payment info:", error);
    throw error;
  }
};
