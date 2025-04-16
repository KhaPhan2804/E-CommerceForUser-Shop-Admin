import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import supabase from '../database/supabase';

type PendingRouteProp = RouteProp<ParamList, 'History'>;

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

export default function HistoryScreen() {
  const route = useRoute<PendingRouteProp>();
  const navigation = useNavigation();
  const { MaKH } = route.params;

  const [orders, setOrders] = useState<Orders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('Donhang')
          .select('*')
          .eq('MaKH', MaKH)
          .eq('status', 'Hoàn thành');
        
        if (error) {
          console.error('Error fetching orders:', error);
        } else {
          setOrders(data);
          fetchProductData(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProductData = async (orders: Orders[]) => {
      const productIds = orders.map((order) => order.productID);
      try {
        const { data, error } = await supabase
          .from('Product') 
          .select('id, name, image')
          .in('id', productIds);
        
        if (error) {
          console.error('Error fetching products:', error);
        } else {
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchOrders();
  }, [MaKH]);

  const getProductDetails = (productID: number) => {
    const product = products.find((prod) => prod.id === productID);
    return product ? product : null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  

  const renderOrderCard = (item: Orders) => {
    const product = getProductDetails(item.productID);
    if (!product) return null; 

    return (
      <View style={styles.card} key={item.id}>
        <Text style={styles.cardTitle}>Đơn hàng #{item.order_id}</Text>
        <View style={styles.productContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productDetails}>
            <Text style={styles.cardDetails}>Sản phẩm: {product.name}</Text>
            <Text style={styles.cardDetails}>Số lượng: {item.quantity}</Text>
            <Text style={styles.cardDetails}>Tổng chi phí: {formatPrice(item.totalCost + item.shipfee)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử mua hàng</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.cardList}>
          {orders.map(renderOrderCard)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  goBackButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#efefef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  loader: {
    marginTop: 20,
  },
  cardList: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  productDetails: {
    flex: 1,
  },
  cardDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
});
