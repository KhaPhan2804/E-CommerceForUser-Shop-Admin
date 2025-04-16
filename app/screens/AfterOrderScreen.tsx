import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native'
import { RouteProp, useRoute } from '@react-navigation/native';
import ParamList from '../navigation/Data';
import { useNavigation } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

type navigationProp = NativeStackNavigationProp<ParamList, 'AfterOrder'>;
type AfterOrderRouteProp = RouteProp<ParamList, 'AfterOrder'>;


export default function AfterOrderScreen() {
  const navigation = useNavigation<navigationProp>();
  const route = useRoute<AfterOrderRouteProp>();

  const {MaKH} = route.params;

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt hàng thành công {MaKH} </Text>
      </View>

      <View style={styles.Card}>
        <TouchableOpacity style={styles.confirmButton} onPress={()=>navigation.navigate('Main')}>
          <Text style={styles.confirmButtonText}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={()=>navigation.navigate('Pending', {MaKH})}>
          <Text style={styles.confirmButtonText}>Đơn mua</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recommendCard}>
        <Text style={styles.recommendTitle}>--- Sản phẩm bạn có thể thích ---</Text>
      </View>
    </View>
  )
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
  Card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    
  },
  recommendCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  confirmButton: {
    borderColor: '#111111',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  confirmButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: 'bold',
  },
});