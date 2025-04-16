import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Alert, ScrollView, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import supabase from '../database/supabase'; // Update this import to your actual Supabase client import

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
  created_at: string;
  updated_at: string;
  address: string;
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

  const handleStatusChange = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('Donhang')
        .update({ status: 'Đang vận chuyển' })
        .eq('id', orderId);

      if (error) throw error;

      Alert.alert('Cập nhật trạng thái', 'Trạng thái đơn hàng đã được cập nhật.');

      fetchOrders();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error updating status', errorMessage);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.ordersList}>
      {orders.map((order) => (
        <View key={order.id} style={styles.orderContainer}>
          <Text style={styles.orderTitle}>Order ID: {order.id}</Text>
          <Text>Trạng thái: {order.status === 'pending' ? 'Đợi xác nhận' : order.status}</Text>
          <Text>Phương thức thanh toán: {order.paymentMethod}</Text>
          <Text>Tổng chi phí: {formatPrice(Number(order.totalCost))}</Text> 
          <Text>Địa chỉ: {order.address}</Text>
          <Text>Thời gian: {formatDate(order.created_at)}</Text>

          <View style={styles.orderItemsList}>
            {order.order_items.map((item) => (
              <View key={item.id} style={styles.orderItemContainer}>
                <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                <View style={styles.orderItemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text>Giá: {formatPrice(item.price)}</Text> 
                  <Text>Số lượng: {item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          {order.status === 'pending' && (
            <Button
              title="XÁC NHẬN"
              onPress={() => handleStatusChange(order.id)}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ordersList: {
    padding: 16,
    backgroundColor: '#FFF8E8',
  },
  orderContainer: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderItemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 16,
  },
  orderItemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
  },
  orderItemsList: {
    marginTop: 10,
  },
});
