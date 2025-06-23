import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';

type navigationProp = NativeStackNavigationProp<ParamList, 'AdminUserDetail'>;
type AdminUserDetailRouteProp = RouteProp<ParamList, 'AdminUserDetail'>

export default function AdminDetail() {
  const route = useRoute<AdminUserDetailRouteProp>();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const {userId} = route.params;


  const fetchUserDetails = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Khachhang')
        .select('*')
        .eq('userID', userId)
        .single();

      if (error) throw error;

      setInfo(data);
    } catch (error) {
      Alert.alert('Error fetching product details', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      fetchUserDetails(userId)
    }, [userId]);

  if (isLoading) {
      return <ActivityIndicator size="large" color="#111111" style={styles.loadingIndicator} />;
  }
  
  if (!info) {
    return <Text>User is not found</Text>;
  }
  
  return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Kháchh hàng: {info.name}</Text>
        </View>
  
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Image source={{ uri: info.avatar }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>Tên khách hàng: {info.name}</Text>
              <Text>Địa chỉ: {info.address}</Text>
              <Text>Email: {info.email}</Text>
              <Text>Số điện thoại: {info.phone}</Text>
              <Text>
              Quyền quản trị:{' '}
              {info.roleID === 1
              ? 'Khách hàng'
              : info.roleID === 2
              ? 'Admin'
              : info.roleID === 3
              ? 'Admin Chính'
              : 'Bị cấm'}
              </Text>
              <Text>Mở cửa hàng: {info.setShop === 1 ? 'Đã mở' : 'Chưa'}</Text>
              <Text>
              Địa chỉ cụ thể: 
              {info.Duong || info.Phuong || info.Quan || info.Tinh ? 
              `${info.Duong ? info.Duong : ''} ${info.Phuong ? info.Phuong : ''} ${info.Quan ? info.Quan : ''} ${info.Tinh ? info.Tinh : ''}` : 
              'Chưa có'
              }
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: '#F9F9F9',
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
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginLeft: 10,
    },
    cardContainer: {
      marginTop: 20,
      paddingHorizontal: 16,
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    productImage: {
      width: '100%',
      height: 300,
      borderRadius: 10,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      resizeMode: 'contain',
    },
    productDetails: {
      marginTop: 16,
    },
    productName: {
      fontWeight: 'bold',
      fontSize: 18,
      color: '#333',
    },
    loadingIndicator: {
      marginTop: 50,
    },
  });