import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';

type StatCardProps = {
    label: string;
    value: string | number;
    icon: any;
};


export default function HomeAdmin() {
  const [stats, setStats] = useState({
    users: 0,
    shops: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);

    const [{ count: userCount }, { count: shopCount }, { count: productCount }, ordersRes,  { count: categoryCount },] =
      await Promise.all([
        supabase.from('Khachhang').select('*', { count: 'exact', head: true }),
        supabase.from('shop').select('*', { count: 'exact', head: true }),
        supabase.from('Product').select('*', { count: 'exact', head: true }),
        supabase.from('Donhang').select('totalCost'),
        supabase.from('Category').select('*', { count: 'exact', head: true }),
    ]);

    const totalRevenue = ordersRes?.data?.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const orderCount = ordersRes?.data?.length || 0;

    setStats({
      users: userCount || 0,
      shops: shopCount || 0,
      products: productCount || 0,
      orders: orderCount,
      categories: categoryCount || 0,
      revenue: totalRevenue || 0,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Đang tải thống kê...</Text>
      </View>
    );
  }

  const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
    <View style={styles.chatRoomCard}>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Ionicons name={icon} size={24} color="#555" />
    </View>
  );

  const formatCurrency = (num: number) =>
    num.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Ionicons name={"desktop-outline"} size={24} color="#555" />
        <Text style={styles.headerTitle}>Tổng quan hệ thống</Text>
      </View>
  
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardGrid}>
          <StatCard label="Khách hàng" value={stats.users} icon="people" />
          <StatCard label="Cửa hàng" value={stats.shops} icon="storefront" />
          <StatCard label="Sản phẩm" value={stats.products} icon="pricetag" />
          <StatCard label="Đơn hàng" value={stats.orders} icon="cart" />
          <StatCard label="Doanh thu" value={formatCurrency(stats.revenue)} icon="cash" />
          <StatCard label="Danh mục" value={stats.categories} icon="list" />
        </View>
      </ScrollView>
    </View>
  );
  
};

const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: '#f9f9f9',
    },
    screen: {
        flex: 1,
        backgroundColor: '#f9f9f9',
      },
      header: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        flexDirection:'row'
      },
      headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
      },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    chatRoomCard: {
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      width: '48%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    label: {
      color: '#555',
      fontSize: 14,
      marginBottom: 4,
    },
    value: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 8,
      fontSize: 16,
      color: '#333',
    },
  });