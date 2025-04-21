import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';
import * as Linking from 'expo-linking';
import ParamList from '../navigation/Data';
import { createPaymentLink, cancelPayment, getPaymentInfo } from '../database/payment';
import { WebView } from 'react-native-webview';

type PaymentRouteProp = RouteProp<ParamList, 'Order'>;
type NavigationProp = NativeStackNavigationProp<ParamList, 'Payment'>;

export default function PaymentConfirm() {
  const route = useRoute<PaymentRouteProp>();
  const { totalCost, maKH } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const returnUrl = 'myapp://payment-success';
  const cancelUrl = 'myapp://payment-success';

  const createPayment = async () => {
    try {
      const response = await createPaymentLink({
        orderCode: Math.floor(Math.random() * 1000000),
        amount: totalCost,
        description: "Thanh toán đơn hàng",
        returnUrl,
        cancelUrl,
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

  const interceptNavigation = async (event: any) => {
    const url = event.url;

    if (url.includes('/payment-success')) {
      if (paymentId) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const info = await getPaymentInfo(paymentId);
          console.log("Payment Info:", info);
        } catch (e) {
          console.error("Failed to fetch info for paymentId:", paymentId);
        }
      }

      navigation.navigate('AfterOrder', { MaKH: Number(maKH) });
      return false;
    }

    if (url.includes('/payment-cancel')) {
      if (paymentId) {
        try {
          await cancelPayment(paymentId, 'Người dùng hủy thanh toán');
          console.log("Payment cancelled.");
        } catch (err) {
          console.error("Cancel failed:", err);
        }
      }
      navigation.goBack();
      return false;
    }

    return true;
  };

  useEffect(() => {
    createPayment();

    const handleDeepLink = async (event: any) => {
      const url = event.url;

      if (url.includes('/payment-success')) {
        navigation.navigate('AfterOrder', { MaKH: Number(maKH) });
      }

      if (url.includes('/payment-cancel')) {
        if (paymentId) {
          try {
            await cancelPayment(paymentId, 'Người dùng hủy thanh toán');
            navigation.navigate('PaymentCancel');
          } catch (err) {
            console.error("Cancel failed:", err);
          }
        }
        navigation.goBack();
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      {paymentUrl ? (
        <>
          {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />}
          <WebView
            source={{ uri: paymentUrl }}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState={true}
            style={{ flex: 1 }}
            onShouldStartLoadWithRequest={(event) => {
              interceptNavigation(event);
              return true;
            }}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff5555' }]}
              onPress={async () => {
                if (paymentId) {
                  await cancelPayment(paymentId, 'Người dùng hủy thanh toán');
                }
                navigation.navigate('PaymentCancel');
              }}
            >
              <Text style={styles.buttonText}>❌ Hủy thanh toán</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#4CAF50' }]}
              onPress={() => {
                navigation.navigate('PaymentAccept');
              }}
            >
              <Text style={styles.buttonText}>✅ Xác nhận đã thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.text}>Loading payment URL...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
