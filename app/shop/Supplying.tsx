import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import supabase from '../database/supabase';

type PendingRouteProp = RouteProp<ParamList, 'AcceptPending'>;

type Orders = {
  id: number;
  quantity: number;
  totalCost: number;
  productID: number;
  status: string;
  shipfee: number;
  order_id: string;
};

type Product = {
  id: number;
  name: string;
  image: string;
};

export default function Supplying() {
  const route = useRoute<PendingRouteProp>();
  const navigation = useNavigation();
  const { idShop } = route.params;

  const [orders, setOrders] = useState<Orders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);


  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Donhang')
        .select('*')
        .eq('shopId', idShop) 
        .eq('status', 'Chuẩn bị hàng');
      
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
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [idShop]);

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

  const confirmOrder = async (orderId: number, productId: number, quantity: number) => {
    try {
      
      const { data: product, error: fetchError } = await supabase
        .from('Product')
        .select('Stock, Sold, status')
        .eq('id', productId)
        .single();
  
      if (fetchError) {
        console.error('Error fetching product stock:', fetchError);
        return;
      }
  
      const currentStock = product.Stock;
      const currentSold = product.Sold || 0; 
      const newStock = currentStock - quantity;
      const newSold = currentSold + quantity;

      const updates: { Stock: number; Sold: number; status?: string } = { 
        Stock: newStock, 
        Sold: newSold 
      };
  
      if (newStock === 0) {
        updates.status = "Outstock";
      }

      const { error: updateError } = await supabase
        .from('Product')
        .update(updates)
        .eq('id', productId);
  
      if (updateError) {
        console.error('Error updating product stock and sold:', updateError);
        return;
      }

      const { error: orderError } = await supabase
        .from('Donhang')
        .update({ status: 'Hàng đang được giao' })
        .eq('id', orderId);
  
      if (orderError) {
        console.error('Error updating order status:', orderError);
      } else {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: 'Hàng đang được giao' } : order
          )
        );
        fetchOrders();
      }
    } catch (error) {
      console.error('Unexpected error confirming order:', error);
    }
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
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={() => confirmOrder(item.id, item.productID, item.quantity)}
        >
          <Text style={styles.confirmButtonText}>Xác nhận giao cho đơn vị vận chuyển</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuẩn bị đơn hàng</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.cardList}>
          {orders.length === 0 ? (
            <Text style={styles.noOrdersText}>-- Không có đơn hàng nào đang chờ xử lý --</Text>
          ) : (
            orders.map(renderOrderCard)
          )}
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
  confirmButton: {
    backgroundColor: '#111111',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noOrdersText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
});
