import { View, Text, Button, Linking } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';
import supabase, { getJwtToken } from '../database/supabase';

// Define types for route and navigation props
type PaymentRouteProp = RouteProp<ParamList, 'Order'>;
type NavigationProp = NativeStackNavigationProp<ParamList, 'Payment'>;

export default function PaymentConfirm() {
  const route = useRoute<PaymentRouteProp>();
  const { totalCost } = route.params;  // Access total cost from route params
  const navigation = useNavigation<NavigationProp>();
  const [paymentUrl, setPaymentUrl] = useState<string>(''); // To store the payment URL

  // Ensure to replace these with actual environment variables or a config
  const clientId = '674ded78-8dfa-4d79-8562-4a0dd12e1d72';  // Replace with your actual client ID
  const apiKey = '4b3c7eaa-8cc6-4a63-9f15-8eec82f893be';  // Replace with your actual API Key

  // Function to create payment
  const createPayment = async () => {
    try {
      const jwtToken = await getJwtToken();
      console.log('Authorization Header:', `Bearer ${jwtToken}`);  // Get the JWT token

      if (!jwtToken) {
        console.log('No JWT Token available!');
        return;
      }

      // Ensure totalCost is a valid number
      if (!totalCost || isNaN(totalCost)) {
        console.log('Invalid totalCost:', totalCost);
        return;
      }
      console.log('Total Cost:', totalCost);

      // Making the API request to create a payment
      const response = await fetch('https://njulzxtvzglbrsxdgbcq.supabase.co/functions/v1/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey,
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          amount: totalCost,
          description: 'Test Order',  // Customize with actual order details
        }),
      });

      if (!response.ok) {
        console.log('Error: API request failed with status', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        return;
      }

      const data = await response.json();
      console.log('Payment Link:', data.checkoutUrl);

      // If payment URL is returned, update the state to redirect the user
      if (data.checkoutUrl) {
        setPaymentUrl(data.checkoutUrl);
      } else {
        console.log('Error: No checkout URL found');
      }
    } catch (error) {
      console.log('Error creating payment:', error);
    }
  };

  // Handle payment redirection
  const handlePaymentRedirect = () => {
    if (paymentUrl) {
      Linking.openURL(paymentUrl)  // Open the payment URL in the browser
        .catch((err) => console.error('Error opening payment URL', err));
    }
  };

  // Trigger the payment creation once the component is mounted
  useEffect(() => {
    createPayment();
  }, []);  // Empty dependency array ensures this runs only once on mount

  return (
    <View>
      <Text>Payment Confirmation {totalCost} </Text>
      {paymentUrl ? (
        <Button title="Go to Payment" onPress={handlePaymentRedirect} />
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
}
