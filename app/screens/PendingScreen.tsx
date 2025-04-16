import React, { useEffect, useState } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import supabase from '../database/supabase';

type PendingRouteProp = RouteProp<ParamList, 'Pending'>;

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

export default function PendingScreen() {
  const route = useRoute<PendingRouteProp>();
  const navigation = useNavigation();
  const { MaKH } = route.params;

  const [orders, setOrders] = useState<Orders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);  // Track selected reason

  useEffect(() => {
    fetchOrders();
  }, [MaKH]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Donhang')
        .select('*')
        .eq('MaKH', MaKH)
        .eq('status', 'Đợi xác nhận');
      
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

  const handleCancelOrder = async () => {
    if (!selectedOrder || !selectedReason) {
      alert('Please select a reason for cancellation.');
      return;
    }

    try {
      // Update the status to "Đã Hủy" and add the cancellation reason to the order
      const { error } = await supabase
        .from('Donhang')
        .update({
          status: 'Đã hủy',
          reasonCancel: selectedReason,
        })
        .eq('id', selectedOrder);

      if (error) {
        console.error('Error canceling order:', error);
      } else {
        alert('Order canceled successfully.');
        setIsModalVisible(false);
        fetchOrders(); 
      }
    } catch (error) {
      console.error('Error canceling order:', error);
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
          style={styles.cancelButton}
          onPress={() => {
            setSelectedOrder(item.id);
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
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
        <Text style={styles.headerTitle}>Đợi xác nhận</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.cardList}>
          {orders.length === 0 ? (
            <Text style={styles.noOrdersText}>-- Không có đơn hàng nào đang đợi xác nhận --</Text>
          ) : (
            orders.map(renderOrderCard)
          )}
        </ScrollView>
      )}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn lý do hủy</Text>
            {['Sản phẩm không hợp nhu cầu', 'Đổi kích cở khác', 'Không mua nữa', 'Lý do khác'].map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={styles.reasonButton}
                onPress={() => setSelectedReason(reason)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason ? styles.selectedReasonText : null,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelActionButton} onPress={handleCancelOrder}>
              <Text style={styles.cancelActionButtonText}>Hủy đơn hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cancelButton: {
    borderColor: '#f44336',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  reasonButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
  },
  noOrdersText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedReasonText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  cancelActionButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    marginTop: 15,
    alignItems: 'center',
    borderRadius: 5,
  },
  cancelActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeModalButton: {
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
