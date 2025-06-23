import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../database/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { getShipmentFee } from '../database/GHTK'


type PurchaseRoute = RouteProp<ParamList, 'Purchase'>;

type navigationProp = NativeStackNavigationProp<ParamList, 'AfterOrder'>;



const formatPrice = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'VND',
});

const generateRandomString = async (length = 11) => {

  const randomBytes = await Crypto.getRandomBytesAsync(length);

  const randomString = randomBytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    ''
  );

  return randomString.slice(0, length);
};

export default function PurchaseScreen({ route }: { route: PurchaseRoute }) {
  const { id, name, price, quantity, image } = route.params;
  const [paymentMethod, setPaymentMethod] = useState<string>('Thanh toán khi nhận hàng');
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shopID, setShopID] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  

  const navigation = useNavigation<navigationProp>();

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    setIsDropdownVisible(false);
  }


  useEffect(() => {
    const fetchShippingFee = async () => {
      setIsLoading(true);
  
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.session?.user) {
          console.error('Session error:', sessionError);
          return;
        }
  
        const userId = session.session.user.id;
  
        const { data: customerData, error: customerError } = await supabase
          .from('Khachhang')
          .select('MaKH, Quan, Tinh, Phuong, Duong')
          .eq('userID', userId)
          .single();
  
        if (customerError || !customerData) {
          console.error('Customer fetch error:', customerError);
          return;
        }
  
        const { data: productData, error: productError } = await supabase
          .from('Product')
          .select('shopId, Weight, price')
          .eq('id', id)
          .single();
  
        if (productError || !productData) {
          console.error('Product fetch error:', productError);
          return;
        }
  
        const { data: shopData, error: shopError } = await supabase
          .from('shop')
          .select('Quan, Tinh, Phuong, Duong')
          .eq('id', productData.shopId)
          .single();
  
        if (shopError || !shopData) {
          console.error('Shop fetch error:', shopError);
          return;
        }
  
        const body = {
          pick_province: shopData.Tinh,
          pick_district: shopData.Quan,
          province: customerData.Tinh,
          district: customerData.Quan,
          address: customerData.Duong,
          weight: productData.Weight || 500,
          value: productData.price || 0,
          transport: 'road',
          deliver_option: 'none',
          tags: [],
        };
  
        const fee = await getShipmentFee(body);
        console.log('GHTK Fee Response:', fee);
        if (fee) {
          setShippingFee(fee.fee.fee);
          setShopID(productData.shopId);
        }
      } catch (err) {
        console.error('Shipping fee error:', err);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchShippingFee();
  }, []);
  

  const handleConfirmPurchase = async () => {
    
    try {
      const orderId = await generateRandomString();
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session?.user) {
        Alert.alert('Lỗi', 'Không thể xác minh người dùng.');
        return;
      }

      const userId = session.session.user.id;
      const { data: customerData, error: customerError } = await supabase
        .from('Khachhang')
        .select('MaKH, address')
        .eq('userID', userId)
        .single();


      if (customerError || !customerData?.MaKH) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin khách hàng.');
        return;
      }


      const orderData = {
        MaKH: customerData.MaKH,
        productID: id,
        quantity,
        totalCost: price * quantity,
        shopId: shopID,
        paymentMethod,
        status: 'Đợi xác nhận',
        address: customerData.address,
        ordertime: new Date().toISOString(),
        updatetime: new Date().toISOString(),
        shipfee: shippingFee,
        order_id: orderId,
      };

      const { error: orderError } = await supabase.from('Donhang').insert([orderData]);

      if (orderError) {
        Alert.alert('Lỗi', 'Không thể đặt đơn hàng. Vui lòng thử lại.');
        return;
      }

      Alert.alert('Đặt hàng thành công!', `Cảm ơn bạn đã mua ${name}.`, [
        { text: 'OK'},
      ]);
      
      const MaKH = customerData.MaKH;

      if (paymentMethod === 'Thanh toán khi nhận hàng') {
        navigation.navigate('AfterOrder', {MaKH});
      }else{
        navigation.navigate('Payment', {
          maKH: MaKH,
          totalCost: price * quantity,
          orders: [
            {
              productId: id,
              quantity,
              order_id: orderId,
            }
          ],
        });
      }

      
    } catch (e) {
      console.error('Unexpected error during purchase:', e);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin sản phẩm</Text>
      </View>

      <View style={styles.card}>
        <Image source={{ uri: image }} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.price}>Giá: {formatPrice.format(price)}</Text>
          <Text style={styles.quantity}>Số lượng: {quantity}</Text>
          <Text style={styles.totalCost}>
            {shippingFee !== null ? formatPrice.format(shippingFee) : 'Không có phí vận chuyển'}
          </Text>
        </View>
      </View>

      

      <View style={styles.paymentCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Tổng:</Text>
          <Text style={styles.totalCost}>{formatPrice.format((price * quantity))}</Text>
          
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Phí vận chuyển:</Text>
          <Text style={styles.totalCost}>
          {shippingFee !== null ? formatPrice.format(shippingFee) : 'Không có phí vận chuyển'}
          </Text>
          </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Tổng chi phí:</Text>
          <Text style={styles.totalCost}>{shippingFee !== null ? formatPrice.format((price * quantity)+ shippingFee ) : 'Không có phí vận chuyển'}</Text>
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

        <TouchableOpacity style={styles.paymentButton} onPress={handleConfirmPurchase}>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  goBackButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#efefef',
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
  dropdownButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E33B5',
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
