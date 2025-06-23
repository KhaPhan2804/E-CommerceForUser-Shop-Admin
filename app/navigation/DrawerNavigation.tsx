import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { DrawerItemList, createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from '../database/supabase'; 
import HomeAdmin from '../admin/HomeAdmin';
import ProductAdmin from '../admin/ProductAdmin';
import DonHangAdmin from '../admin/DonHangAdmin';
import CategoryAdmin from '../admin/CategoryAdmin';
import UserAdmin from '../admin/UserAdmin';
import { useNavigation } from 'expo-router';
import ParamList from './Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AcceptProduct from '../admin/AcceptProduct';
import AdminShop from '../admin/AdminShop';

type navigationProp = NativeStackNavigationProp<ParamList, 'Login'>;

const Drawer = createDrawerNavigator();

export default function DrawerNavigation() {
  const [user, setUser] = useState<any>(null); 
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState<string|null>('');
  const navigation = useNavigation<navigationProp>();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigation.navigate('Login');
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        return;
      }

      if (session?.session?.user) {
        setUser(session.session.user); 

        const fetchAvatar = async () => {
          try {
            const { data, error } = await supabase
              .from('Khachhang')
              .select('avatar, name')
              .eq('userID', session.session.user.id) 
              .single();

            if (error) throw error;

            setAvatarUrl(data?.avatar); 
            setName(data?.name);
          } catch (error) {
            console.error('Error fetching avatar:', error);
          }
        };

        fetchAvatar();
      }
    };

    getCurrentUser();
  }, []);

  return (
    <Drawer.Navigator
      drawerContent={(props) => {
        return (
          <SafeAreaView style={styles.drawerContainer}>
            <View style={styles.profileContainer}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.emptyAvatar}>
                  <Ionicons name="person-outline" size={40} color="#fff" />
                </View>
              )}
              <Text style={styles.username}>{name}</Text>
              <Text style={styles.username}>{user ? user.email : 'Guest'}</Text>
            </View>
            <DrawerItemList {...props} />
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#333" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </SafeAreaView>
        );
      }}
      screenOptions={{
        drawerStyle: { backgroundColor: "white", width: 300, borderRadius: 12 },
        headerStyle: { backgroundColor: '#fff' },
        headerShown: false,
        headerTintColor: '#fff',
        drawerLabelStyle: { color: '#111111', fontSize: 15, fontWeight: '500', },
      }}
    >
      <Drawer.Screen
        name="AdminHome"
        options={{
          drawerLabel: "Trang chủ",
          drawerIcon: () => <Ionicons name="home-outline" size={24} color="#333" />,
        }}
        component={HomeAdmin}
      />
      <Drawer.Screen
        name="AdminDonhang"
        options={{
          drawerLabel: "Quẩn lý đơn hàng",
          drawerIcon: () => <Ionicons name="receipt-outline" size={24} color="#333" />,
        }}
        component={DonHangAdmin}
      />
      <Drawer.Screen
        name="AdminKhachhang"
        options={{
          drawerLabel: "Quản lý người dùng",
          drawerIcon: () => <Ionicons name="people-outline" size={24} color="#333" />,
        }}
        component={UserAdmin}
      />
      <Drawer.Screen
        name="AdminCategory"
        options={{
          drawerLabel: "Quản lý danh mục",
          drawerIcon: () => <Ionicons name="folder-outline" size={24} color="#333" />,
        }}
        component={CategoryAdmin}
      />
      <Drawer.Screen
        name="AdminProduct"
        options={{
          drawerLabel: "Quản lý sản phẩm",
          drawerIcon: () => <Ionicons name="basket-outline" size={24} color="#333" />,
        }}
        component={ProductAdmin}
      />
      <Drawer.Screen
        name="AdminAccept"
        options={{
          drawerLabel: "Duyệt sản phẩm",
          drawerIcon: () => <Ionicons name="alert-outline" size={24} color="#333" />,
        }}
        component={AcceptProduct}
      />
      <Drawer.Screen
      name="AdminShop"
      options={{
        drawerLabel: "Quản lý cửa hàng",
        drawerIcon: () => <Ionicons name="card-outline" size={24} color="#333" />,
      }}
      component={AdminShop}
    />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',  
  },
  profileContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    marginBottom: 12,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 'auto',
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
