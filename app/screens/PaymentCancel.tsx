import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import supabase from '../database/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PaymentCancelRouteProp = RouteProp<ParamList, 'PaymentCancel'>;

type NavigationProp = NativeStackNavigationProp<ParamList, 'Payment'>;

type Orders = {
  id: number;
  quantity: number;
  totalCost: number;
  productID: number;
  shipfee: number;
  order_id: string;
};

type Product = {
  id: number;
  name: string;
  image: string;
};

export default function PaymentCancel() {
  const route = useRoute<PaymentCancelRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { order_id } = route.params;

  const [orders, setOrders] = useState<Orders[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Donhang')
        .select('*')
        .in('order_id', order_id);

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data);
        fetchProducts(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async (orders: Orders[]) => {
    const productIds = orders.map(order => order.productID);
    const { data, error } = await supabase
      .from('Product')
      .select('id, name, image')
      .in('id', productIds);

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
  };

  const getProduct = (id: number) => products.find(p => p.id === id);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const handleContinueShopping = async () => {
    try {
      const { error } = await supabase
        .from('Donhang')
        .update({
          status: 'Đã hủy',
          paymentStatus: 'Cancelled',
          reasonCancel: 'Hủy thanh toán',
        })
        .in('order_id', order_id);

      if (error) {
        console.error('Error updating orders:', error);
      } else {
        navigation.navigate('Main'); 
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Khách hàng đã hủy thanh toán</Text>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : orders.length === 0 ? (
        <Text>Không tìm thấy đơn hàng</Text>
      ) : (
        orders.map(order => {
          const product = getProduct(order.productID);
          return (
            <View style={styles.card} key={order.id}>
              <Text style={styles.title}>Đơn hàng #{order.order_id}</Text>
              {product && (
                <View style={styles.productInfo}>
                  <Image source={{ uri: product.image }} style={styles.image} />
                  <View>
                    <Text>Sản phẩm: {product.name}</Text>
                    <Text>Số lượng: {order.quantity}</Text>
                    <Text>Tổng tiền: {formatPrice(order.totalCost + order.shipfee)}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}

      {!isLoading && (
        <TouchableOpacity style={styles.button} onPress={handleContinueShopping}>
          <Text style={styles.buttonText}>Tiếp tục mua sắm</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#cc0000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  button: {
    borderColor:'#111111',
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#111111',
    fontWeight: '600',
    fontSize: 16,
  },
});
