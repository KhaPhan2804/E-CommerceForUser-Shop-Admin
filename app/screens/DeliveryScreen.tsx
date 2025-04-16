import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as Icon from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamList } from '../navigation/Data';
import supabase from '../database/supabase';
import { bgColor } from '../themes';
import { useFocusEffect } from '@react-navigation/native';

interface OrderItem {
  name: string;
  price: number;
  image: string;
  quantity: number;
  id: number;
}

interface Order {
  id: string;
  user_id: string;
  totalCost: number;
  paymentMethod: string;
  status: string;
  order_items: OrderItem[];
  address: string;
  created_at: string;
}

type navigationProp = NativeStackNavigationProp<ParamList, 'Delivery'>;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  });
};

const formatPrice = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'VND',
});

export default function DeliveryScreen() {
  const navigation = useNavigation<navigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchOrders = async () => {
        setIsLoading(true); // Start loading
        try {
          const { data: session, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session?.session?.user) {
            console.error('Error fetching session or user not authenticated');
            return;
          }

          const userId = session.session.user.id;

          const { data, error: customerError } = await supabase
            .from('Khachhang')
            .select('MaKH')
            .eq('userID', userId)  
            .single();

          if (customerError || !data?.MaKH) {
            console.error('Error fetching MaKH for the user');
            return;
          }

          const maKH = data.MaKH;

          const { data: orderData, error: orderError } = await supabase
            .from('Donhang')
            .select('*')
            .eq('user_id', maKH); 

          if (orderError) {
            console.error('Error fetching orders data:', orderError);
            return;
          }

          if (orderData) {
            const parsedOrders = orderData.map((order: any) => ({
              ...order,
              order_items: order.order_items ? JSON.parse(order.order_items) : [],
            }));

            setOrders(parsedOrders);
          }
        } catch (err) {
          console.error('Unexpected error:', err);
        }
        setIsLoading(false); // Stop loading
      };

      fetchOrders();
    }, [])
  );

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('Donhang')
        .update({ status: 'Đã nhận được hàng' }) 
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
      } else {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'Đã nhận được hàng' } : order
          )
        );
      }
    } catch (err) {
      console.error('Unexpected error during delivery confirmation:', err);
    }
  };

  return (
    <View style={style.container}>
      <View style={style.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={style.goBackButton}>
          <Icon.ArrowLeft strokeWidth={3} stroke={bgColor.bgcolor} />
        </TouchableOpacity>
        <Text style={style.headerTitle}>Quản lý đặt hàng</Text>
      </View>

      {isLoading ? (
        <View style={style.loadingContainer}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      ) : orders.length === 0 ? (
        <View style={style.emptyContainer}>
          <Text style={style.emptyText}>Hiện tại chưa có đơn hàng nào được đặt</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={style.itemsContainer}>
          {orders.map(order => (
            <View key={order.id} style={style.orderItem}>
              <Text style={style.orderTitle}>Đơn hàng: {order.id}</Text>
              <Text style={style.orderStatus}>
                Trạng thái: {order.status === 'pending' ? 'Đợi xác nhận' : order.status === 'Đang vận chuyển' ? 'Đang vận chuyển' : 'Đã nhận được hàng'}
              </Text>
              <Text style={style.orderTotal}>Tổng chi phí: {formatPrice.format(order.totalCost)}</Text>
              <Text style={style.orderAddress}>Địa chỉ: {order.address || 'Chưa có địa chỉ'}</Text>
              <Text style={style.orderDate}>Ngày Đặt: {formatDate(order.created_at)}</Text>

              <View style={style.orderItemsList}>
                {order.order_items.map(item => (
                  <View key={item.id} style={style.itemContainer}>
                    <Image source={{ uri: item.image }} style={style.itemImage} />
                    <View style={style.itemDetails}>
                      <Text style={style.itemName}>Tên sản phẩm: {item.name}</Text>
                      <Text style={style.itemPrice}>Giá: {formatPrice.format(item.price)}</Text>
                      <Text style={style.itemQuantity}>Số lượng: {item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {order.status !== 'Đã nhận được hàng' && (
                <TouchableOpacity
                  onPress={() => handleConfirmDelivery(order.id)}
                  style={[style.confirmButton, order.status === 'pending' && { backgroundColor: '#ddd' }]}
                  disabled={order.status === 'pending'}
                >
                  <Text style={style.confirmButtonText}>
                    {order.status === 'pending' ? 'Đợi xác nhận' : 'Đã nhận được hàng'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E8',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goBackButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3e33b5a8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 20,
    color: '#333',
  },
  itemsContainer: {
    paddingBottom: 150,
  },
  orderItem: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
    marginHorizontal: 15,
    marginTop: 10,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  orderTotal: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  orderAddress: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  orderItemsList: {
    marginTop: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
    paddingTop: 8,
  },
  itemImage: {
    width: 80, 
    height: 80, 
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  confirmButton: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
