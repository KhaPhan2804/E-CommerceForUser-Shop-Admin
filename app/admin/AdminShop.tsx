import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type navigationProp = NativeStackNavigationProp<ParamList, 'AdminProductDetail'>;

type Shop = { 
  id: number;
  shopname: string;
  shopavatar: string;
  rating: number;
  followers: number;
  makh: number;
  statusShop: number;
  banReason: string;
  banAmount: number;
  banDay: string;
}



export default function AdminShop() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [shop, setShop] = useState<Shop[]>([]);
  const [userNames, setUserNames] = useState<Record<number, string>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('');


  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const { data: shopData, error: shopError } = await supabase.from('shop').select('*');
      if (shopError) throw shopError;

      setShop(shopData);

      const makhList = shopData.map(s => s.makh);

      const { data: users, error: userError } = await supabase
      .from('Khachhang')
      .select('MaKH, name')
      .in('MaKH', makhList);

      if (userError) throw userError;

      const nameMap: Record<number, string> = {};
      users.forEach(user => {
        nameMap[user.MaKH] = user.name;
      });

      setUserNames(nameMap);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching shops', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  

  const getFormattedRating = (rating: string) => {
    const numericRating = parseFloat(rating);
    return numericRating > 5 ? 5 : numericRating;
  }

  const ThongBaoViPham = (shopId: number) => {
    setSelectedShopId(shopId);
    setReason('');
    setDays('');
    setModalVisible(true);
  };

  const handleBanSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Bạn phải nhập lý do vi phạm.');
      return;
    }
  
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số ngày hợp lệ.');
      return;
    }
  
    if (selectedShopId === null) return;
  
    const { error } = await supabase
      .from('shop')
      .update({
        statusShop: 3,
        banReason: reason,
        banAmount: daysNum,
        banDay: new Date().toISOString(),
      })
      .eq('id', selectedShopId);
  
    if (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái cửa hàng.');
    } else {
      Alert.alert('Thành công', 'Cửa hàng đã bị cấm hoạt động.');
      fetchShops();
    }
  
    setModalVisible(false);
  };

  const getDaysRemaining = (banDay: string, banAmount: number) => {
    const start = new Date(banDay);
    const end = new Date(start);
    end.setDate(start.getDate() + banAmount);
    const now = new Date();
  
    const timeDiff = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
    return daysLeft > 0 ? daysLeft : 0;
  };

  const handleUnbanSubmit = async () => {
    if (selectedShopId === null) return;
  
    const { error } = await supabase
      .from('shop')
      .update({
        statusShop: 1, 
        banReason: null, 
        banDay: null, 
        banAmount: null, 
      })
      .eq('id', selectedShopId);
  
    if (error) {
      Alert.alert('Lỗi', 'Không thể gỡ cấm cửa hàng.');
    } else {
      Alert.alert('Thành công', 'Cửa hàng đã được gỡ cấm.');
      fetchShops(); 
    }
  
    setModalVisible(false); 
  };


  useEffect(() => {
    fetchShops();
  }, []);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#111111" style={styles.loadingIndicator} />;
  }

  return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Quản lý cửa hàng</Text>
        </View>
  
        {isLoading && <ActivityIndicator size="large" color="#111111" style={styles.loadingIndicator} />}
  
        <View style={styles.productsContainer}>
          {shop.map((shop) => (
            <View key={shop.id} style={styles.productCard}>
              <Image source={{ uri: shop.shopavatar }} style={styles.productImage} />
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{shop.shopname}</Text>
                <Text style={styles.normalText}>Đánh giá: {getFormattedRating(String(shop.rating))}
                  <Ionicons name="star-outline" size={10} color="#FFD700"/>
                </Text>
                <Text style={styles.normalText1}>Chủ sở hữu: {userNames[shop.makh]}</Text>
                <Text style={styles.normalText2}><Text>
                Tình trạng cửa hàng:{' '}
                {shop.statusShop === 1
                ? 'Đang hoạt động'
                : shop.statusShop === 0
                ? 'Ngừng hoạt động'
                : shop.statusShop === 3
                ? 'Cấm hoạt động'
                : 'Không xác định'}
                </Text>
                </Text>
                {shop.statusShop === 3 && shop.banDay && (
                <Text style={styles.normalText2}>
                Số ngày còn lại trước khi hết cấm hoạt động: {getDaysRemaining(shop.banDay, shop.banAmount)} ngày
                </Text>
                )}
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  onPress={() => {}} 
                  style={[styles.button, styles.viewDetails]}
                >
                  <Text style={styles.buttonText}>XEM CHI TIẾT</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => ThongBaoViPham(shop.id)}
                  style={[styles.button, styles.reportViolation]}
                >
                  <Text style={styles.buttonText1}>THÔNG BÁO VI PHẠM</Text>
                </TouchableOpacity>
                {shop.statusShop === 3 && (
                <TouchableOpacity
                onPress={handleUnbanSubmit}
                style={[styles.button, styles.unbanButton]}
                >
                  <Text style={styles.buttonText1}>GỠ CẤM</Text>
                </TouchableOpacity>
                )}
                
              </View>
            </View>
          ))}
        </View>
        <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        >
        <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Thông báo vi phạm</Text>

        <Text>Lý do vi phạm</Text>
        <TextInput
        placeholder="Nhập lý do"
        value={reason}
        onChangeText={setReason}
        style={styles.modalInput}
        />

        <Text>Thời gian cấm (ngày)</Text>
        <TextInput
        placeholder="Nhập số ngày"
        value={days}
        onChangeText={setDays}
        keyboardType="numeric"
        style={styles.modalInput}
        />

        <View style={styles.modalActions}>
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
          <Text style={styles.modalButtonTextCancel}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBanSubmit} style={styles.modalButton}>
          <Text style={styles.modalButtonTextConfirm}>Cấm</Text>
        </TouchableOpacity>
        </View>
        
      </View>
    </View>
    </Modal>
      </ScrollView>
      
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: '#F9F9F9',
    },
    
    loadingIndicator: {
      marginBottom: 16,
    },

    unbanButton: {
      backgroundColor: '#4CAF50', 
      marginTop: 10, 
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
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
      fontWeight: 'bold',
      color: '#333',
      marginLeft: 10,
    },
    normalText:{
      fontSize: 12,
    },
    normalText1:{
      fontSize: 9,
    },
    normalText2:{
      fontSize: 8,
    },
    productsContainer: {
      marginTop: 20,
    },
    productCard: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      marginBottom: 16,
      padding: 10,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    productImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 16,
    },
    productDetails: {
      flex: 1,
    },
    productName: {
      fontWeight: 'bold',
      fontSize: 18,
      color: '#333',
    },
    buttonContainer: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      width: 120,
      height: 40,
      marginVertical: 5,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
      elevation: 3,
    },
    viewDetails: {
      backgroundColor: '#2196F3',  
    },
    reportViolation: {
      backgroundColor: '#FF9800',  
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 12,
    },
    buttonText1: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 10,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      width: '85%',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 8,
      marginBottom: 10,
      borderRadius: 5,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      padding: 10,
    },
    modalButtonTextCancel: {
      color: 'red',
    },
    modalButtonTextConfirm: {
      color: 'green',
    },
  });

  