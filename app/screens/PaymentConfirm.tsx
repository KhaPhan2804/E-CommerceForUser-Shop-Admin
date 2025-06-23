import { View, Text, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';
import * as Linking from 'expo-linking';
import ParamList from '../navigation/Data';
import { createPaymentLink, cancelPayment, getPaymentInfo } from '../database/payment';
import { WebView } from 'react-native-webview';
import supabase from '../database/supabase';

type PaymentRouteProp = RouteProp<ParamList, 'Payment'>;
type NavigationProp = NativeStackNavigationProp<ParamList, 'Payment'>;
type OrderItem = {
  productId: number;
  quantity: number;
  order_id: string;
};

export default function PaymentConfirm() {
  const route = useRoute<PaymentRouteProp>();
  const { totalCost, maKH, orders } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  
  const [isPaymentCreated, setIsPaymentCreated] = useState(false);

  const fetchProductDetails = async (orders: OrderItem[]) => {
    const productIds = orders.map(o => o.productId);
  
    const { data: products, error } = await supabase
      .from('Product')
      .select('id, name, price')
      .in('id', productIds);
  
    if (error) throw error;
  
    // Map product info to payment items
    const items = orders.map(order => {
      const product = products.find(p => p.id === order.productId);
      return {
        name: product?.name || 'Sản phẩm',
        quantity: order.quantity,
        price: product?.price || 0,
      };
    });
  
    return items;
  };

  const updateOrdersToPaid = async (orderIds: string[]) => {
    const { error } = await supabase
      .from('Donhang')
      .update({
        paymentStatus: 'Success',
        totalPrice: 0,
      })
      .in('order_id', orderIds);
  
    if (error) {
      console.error('Error updating orders to paid:', error);
    }
  };

  const createPayment = async () => {
    if (isPaymentCreated) return;
    setIsPaymentCreated(true);

    try {
      const items = await fetchProductDetails(orders);

      const response = await createPaymentLink({
        orderCode: Math.floor(Math.random() * 1000000),
        amount: totalCost,
        description: "Thanh toán đơn hàng",
        items,
      });

      const { checkoutUrl, orderCode } = response?.data || {};
      if (checkoutUrl) {
        setPaymentUrl(checkoutUrl);
        setPaymentId(orderCode);
      } else {
        throw new Error("Missing checkout URL");
      }
    } catch (error) {
      console.error("Payment request failed:", error);
    }
  };

  const handleDeepLink = (url: string) => {
    try {
      const parsed = Linking.parse(url);
      const path = parsed.path;
      const queryParams = parsed.queryParams ?? {};

      console.log("Redirected path:", path);
      console.log("Query:", queryParams);

      const orderIds = orders.map(order => order.order_id);

      if (path === 'payment-cancel' && queryParams.status === 'CANCELLED') {
        if (paymentId) {
          cancelPayment(paymentId, 'Người dùng hủy thanh toán').catch(console.error);
        }
        navigation.navigate('PaymentCancel',{order_id: orderIds});
      }

      if (path === 'payment-success' && queryParams.success === 'true') {
        if (paymentId) {
          getPaymentInfo(paymentId)
            .then(info => console.log("Payment info:", info))
            .catch(console.error);
        }
        updateOrdersToPaid(orderIds);
        navigation.navigate('AfterOrder', { MaKH: Number(maKH) });
      }
    } catch (err) {
      console.error("Failed to parse or handle URL:", err);
    }
  };

  useEffect(() => {
    createPayment();

    const handleUrl = ({ url }: { url: string }) => {
      console.log("Received redirect:", url);
      handleDeepLink(url);
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [paymentUrl]);

  const interceptNavigation = (event: any) => {
    const url = event.url;

    // Block WebView navigation to the cancel URL
    if (url.startsWith('https://1dd7-2001-ee0-4d45-7a30-41f2-8377-b2f6-ca16.ngrok-free.app/payment-cancel')) {
      handleDeepLink(url);
      return false; 
    }

    if (url.startsWith('https://1dd7-2001-ee0-4d45-7a30-41f2-8377-b2f6-ca16.ngrok-free.app/payment-success')) {
      handleDeepLink(url);
      return false; 
    }

    return true; // Allow WebView to load other URLs
  };

  return (
    <View style={styles.container}>
      {paymentUrl ? (
        <>
          
          <WebView
            source={{ uri: paymentUrl }}
            startInLoadingState
            style={{ flex: 1 }}
            originWhitelist={['https://yourdomain.com/*', '*']}
            onShouldStartLoadWithRequest={interceptNavigation}  // Block cancel URL from being loaded
          />
          
        </>
      ) : (
        <Text style={styles.text}>Loading payment URL...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    zIndex: 1,
  },
  text: {
    marginTop: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
