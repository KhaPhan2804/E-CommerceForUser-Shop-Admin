import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, FlatList } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';


type OrderScreenRouteProp = RouteProp<ParamList, 'Order'>;


type navigationProp = NativeStackNavigationProp<ParamList, 'AfterOrder'>;



const formatPrice = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

export default function OrderScreen({ route }: { route: OrderScreenRouteProp }) {
  const { selectedData, totalCost, maKH, address } = route.params;
  const navigation = useNavigation<navigationProp>();
  const [cart, setCart] = useState(selectedData);  
  const [paymentMethod, setPaymentMethod] = useState<string>('Thanh toán khi nhận hàng');
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [shippingFees, setShippingFees] = useState<{ [productId: number]: any }>({});
  const [selectedShipping, setSelectedShipping] = useState<{ [productId: number]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);

  const fetchShippingFee = async (productId: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Product')
        .select('shipfee, shopId')
        .eq('id', productId)
        .single();
  
      if (error) {
        console.error('Error fetching shipping fee:', error);
      } else {
        setShippingFees(prev => ({
          ...prev,
          [productId]: data.shipfee,
        }));
        if (data.shipfee) {
          const defaultShipping = Object.keys(data.shipfee)[0];  
          setSelectedShipping(prev => ({
            ...prev,
            [productId]: defaultShipping,
          }));
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching shipping fee:', err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cart.forEach(item => {
      fetchShippingFee(item.productId);
    });
  }, [cart]);

  

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    setIsDropdownVisible(false);
  };

  const extractNumericShippingFee = (shipfee: string) => {
    const numericValue = shipfee.replace(/[^\d]/g, ''); 
    return parseInt(numericValue, 10);
  };

  const generateRandomString = async (length = 11) => {
  
    const randomBytes = await Crypto.getRandomBytesAsync(length);
  
    const randomString = randomBytes.reduce(
      (str, byte) => str + byte.toString(16).padStart(2, '0'),
      ''
    );
  
    return randomString.slice(0, length);
  };

  

  const totalSelectedShipfee = cart.reduce((total, item) => {
    const productShippingFee = shippingFees[item.productId]?.[selectedShipping[item.productId]];
    return total + (productShippingFee ? extractNumericShippingFee(productShippingFee) : 0);
  }, 0);

  const finalTotal = totalCost + totalSelectedShipfee;

  const openModal = (productId: number) => {
    setCurrentProductId(productId);
    setModalVisible(true);
  };

  const handleSelectShipping = (method: string) => {
    if (currentProductId !== null) {
      setSelectedShipping((prev) => ({
        ...prev,
        [currentProductId]: method,
      }));
    }
    setModalVisible(false);
  };

  const handleOrder = async () => {
    setIsLoading(true);

    try{
      
      const orderId = await generateRandomString();
      const ordertime = new Date().toISOString();

      const orders = cart.map((item) => ({
        MaKH: maKH,
        shopId: item.shopId,
        productID: item.productId,
        quantity: item.quantity,
        shipfee: extractNumericShippingFee(shippingFees[item.productId]?.[selectedShipping[item.productId]] || null),
        address,
        ordertime,
        updatetime: ordertime,
        paymentMethod,
        status: 'Đợi xác nhận', 
        totalCost: item.price*item.quantity,
        order_id: orderId,
      }));

      const totalCost1 = cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      const { error } = await supabase.from('Donhang').insert(orders);

      if (error) {
        console.error('Error placing order:', error);
      } else {
        console.log('Orders placed successfully');

        const { error: deleteError } = await supabase
        .from('Cart') 
        .delete()
        .in('productID', cart.map(item => item.productId)) 
        .eq('MaKH', maKH); 

      if (deleteError) {
        console.error('Error clearing cart:', deleteError);
      } else {
        console.log('Ordered products cleared from cart successfully');
      }
      }

      if (paymentMethod === 'Thanh toán khi nhận hàng') {
        navigation.navigate('AfterOrder', {MaKH: Number(maKH)});
      }
      else{
        navigation.navigate('Payment',{totalCost: totalCost1});
      }

    }catch(error){
      console.error('Unexpected error placing order:', error);
    }
    setIsLoading(false);
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cart.map((item, index) => (
          <View key={index} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{formatPrice.format(item.price)}</Text>
              <Text style={styles.quantity}>Số lượng: {item.quantity}</Text>

              {isLoading ? (
                <ActivityIndicator size="large" color="#111111" />
              ) : (
                shippingFees[item.productId] && (
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => openModal(item.productId)}>
                    <Text style={styles.dropdownText}>
                      {selectedShipping[item.productId]   || 'Chọn phương thức vận chuyển'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#333" />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        ))}

      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
          {currentProductId !== null && shippingFees[currentProductId] ? (
          Object.keys(shippingFees[currentProductId]).map((item) => (
            <TouchableOpacity 
            key={item} 
            style={styles.dropdownItem} 
            onPress={() => handleSelectShipping(item)}
            >
              <Text style={styles.dropdownText}>
                {item}: {shippingFees[currentProductId][item]}
              </Text>
              {selectedShipping[currentProductId] === item && (
              <Ionicons name="checkmark" size={20} color="green" />
            )}
            </TouchableOpacity>
          ))
        ) : null}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.paymentCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Tổng:</Text>
          <Text style={styles.totalCost}>{formatPrice.format(totalCost)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Phí vận chuyển:</Text>
          <Text style={styles.totalCost}>{formatPrice.format(totalSelectedShipfee)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Tổng chi phí:</Text>
          <Text style={styles.totalCost}>{formatPrice.format(finalTotal)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Phương thức thanh toán:</Text>
          <TouchableOpacity onPress={() => setIsDropdownVisible(!isDropdownVisible)} style={styles.paymentMethod}>
            <Text style={styles.paymentText}>{paymentMethod} ▼</Text>
          </TouchableOpacity>
        </View>

        {isDropdownVisible && (
          <View style={styles.dropdown}>
            <TouchableOpacity onPress={() => handlePaymentMethodSelect('Thanh toán khi nhận hàng')} style={styles.dropdownItem}>
              <Text>Thanh toán khi nhận hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePaymentMethodSelect('Quét mã QR')} style={styles.dropdownItem}>
              <Text>Quét mã QR</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.paymentButton} onPress={handleOrder}>
          <Text style={styles.paymentButtonText}>
            {paymentMethod === 'Thanh toán khi nhận hàng' ? 'Đặt hàng' : 'Xác nhận & Thanh toán'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.8,  
    borderBottomColor: '#000',  
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
  scrollContent: {
    marginTop: 10,
    paddingBottom: 50,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,  
    paddingHorizontal: 5, 
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 10, 
    borderRadius: 15,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: '95%', 
    alignSelf: 'center',
    height: 200, 
  },
  image: {
    width: 75,
    height: 75,
    borderRadius: 10,
  },
  details: {
    marginLeft: 15,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    fontSize: 14,
    color: '#555',
    marginTop: 3,
  },
  quantity: {
    fontSize: 14,
    color: '#888',
    marginTop: 3,
  },
  shippingFeeContainer: {
    marginTop: 10,
  },
  shippingMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'space-between', 
  },
  shippingText: {
    fontSize: 14,
    color: '#555',
    marginRight: 20,
    flex: 1,  
    textAlign: 'left',  
    flexWrap: 'nowrap', 
  },
  switch: {
    position: 'absolute',
    right: 0,
    flexShrink: 0,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap', 
  },
  summaryText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
    minWidth: 150, 
  },
  totalCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E33B5',
  },
  paymentMethod: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  paymentText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 5,
    marginTop: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentButton: {
    backgroundColor: '#111111',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownItem1: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ccc',
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
