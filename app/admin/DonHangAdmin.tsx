import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import supabase from '../database/supabase';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface OrderItem {
  name: string;
  price: number;
  image: string;
  quantity: number;
  id: number;
}

interface Order {
  id: number;
  user_id: string;
  totalCost: string;
  paymentMethod: string;
  status: string;
  order_items: OrderItem[];
  ordertime: string;
  updatetime: string;
  address: string;
  order_id: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  });
};

export default function DonHangAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const navigation = useNavigation();

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('Donhang').select('*');
      if (error) throw error;

      const parsedOrders = data.map((order: any) => ({
        ...order,
        order_items: order.order_items ? JSON.parse(order.order_items) : [],
      }));

      setOrders(parsedOrders || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching orders', errorMessage);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  return (
    <View style={styles.container}>
       <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Đơn Hàng</Text>
      </View>
      <ScrollView contentContainerStyle={styles.ordersList}>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderContainer}>
            <Text style={styles.orderTitle}>Mã Đơn Hàng: {order.order_id}</Text>
            <Text style={styles.status}>Trạng thái: {order.status} vào lúc {formatDate(order.updatetime)}</Text>
            <Text style={styles.text}>Phương thức thanh toán: {order.paymentMethod}</Text>
            <Text style={styles.text}>Tổng chi phí: {formatPrice(Number(order.totalCost))}</Text> 
            <Text style={styles.text}>Địa chỉ: {order.address}</Text>
            <Text style={styles.text}>Thời gian đặt: {formatDate(order.ordertime)}</Text>

            <View style={styles.orderItemsList}>
              {order.order_items.map((item) => (
                <View key={item.id} style={styles.orderItemContainer}>
                  <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                  <View style={styles.orderItemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.text}>Giá: {formatPrice(item.price)}</Text> 
                    <Text style={styles.text}>Số lượng: {item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  ordersList: {
    paddingHorizontal: 16,
  },
  orderContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#FF6B6B', // red color for status
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  orderItemsList: {
    marginTop: 10,
  },
  orderItemContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  orderItemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: '500',
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
