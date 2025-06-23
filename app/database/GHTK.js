import { getJwtToken } from '../database/supabase';

const EDGE_FUNCTION_SHIPMENT_URL = "https://njulzxtvzglbrsxdgbcq.supabase.co/functions/v1/GHTK";

const EDGE_FUNCTION_SHIPMENTFEE_URL = "https://njulzxtvzglbrsxdgbcq.supabase.co/functions/v1/GHTKfee";

export const createShipmentWithGHTK = async (shipmentData) => {
    try {
      const jwtToken = await getJwtToken();
  
      if (!jwtToken) {
        throw new Error("JWT Token is missing or invalid");
      }
  
      const response = await fetch(EDGE_FUNCTION_SHIPMENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(shipmentData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Error response from server:", data);
        throw new Error(data.error || 'Unknown error from Edge Function');
      }
  
      return data;
    } catch (error) {
      console.error("Error creating shipment with GHTK:", error);
      throw error;
    }
};

export const getShipmentFee = async (shipmentData) => {
  try {
    
    const jwtToken = await getJwtToken();

    if (!jwtToken) {
      throw new Error("JWT Token is missing or invalid");
    }

    const response = await fetch(EDGE_FUNCTION_SHIPMENTFEE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(shipmentData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error response from server:", data);
      throw new Error(data.error || 'Unknown error from Edge Function');
    }

    return data;  
  } catch (error) {
    console.error("Error getting shipment fee from GHTK:", error);
    throw error;
  }
};