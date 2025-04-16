import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { DrawerItemList, createDrawerNavigator } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from '../database/supabase'; 
import HomeScreen from '../screens/HomeScreen';
import ProductAdmin from '../admin/ProductAdmin';
import DonHangAdmin from '../admin/DonHangAdmin';
import CategoryAdmin from '../admin/CategoryAdmin';
import UserAdmin from '../admin/UserAdmin';
import { useNavigation } from 'expo-router';
import ParamList from './Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
                  <Text style={styles.emptyAvatarText}>No Avatar</Text>
                </View>
              )}
              <Text style={styles.username}>{name}</Text>
              <Text style={styles.username}>{user ? user.email : 'Guest'}</Text>
            </View>
            <DrawerItemList {...props} />
            <View style={styles.logoutContainer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      }}
      screenOptions={{
        drawerStyle: { backgroundColor: "white", width: 250, borderRadius: 10 },
        headerStyle: { backgroundColor: '#f0f0f0' },
        headerShown: false,
        headerTintColor: '#000',
        drawerLabelStyle: { color: '#000', fontSize: 14, marginLeft: -10 },
      }}
    >
      <Drawer.Screen
        name="AdminHome"
        options={{
          drawerLabel: "Trang chủ",
          title: "Trang chủ",
          headerShadowVisible: false,
          drawerIcon: () => <Ionicons name="home-outline" size={24} color="#000" />,
        }}
        component={HomeScreen}
      />
      <Drawer.Screen
        name="AdminDonhang"
        options={{
          drawerLabel: "Đơn hàng",
          title: "Đơn hàng",
          headerShadowVisible: false,
          drawerIcon: () => <Ionicons name="receipt-outline" size={24} color="#000" />,
        }}
        component={DonHangAdmin}
      />
      <Drawer.Screen
        name="AdminKhachhang"
        options={{
          drawerLabel: "Khách hàng",
          title: "Khách hàng",
          headerShadowVisible: false,
          drawerIcon: () => <Ionicons name="people-outline" size={24} color="#000" />,
        }}
        component={UserAdmin}
      />
      <Drawer.Screen
        name="AdminCategory"
        options={{
          drawerLabel: "Danh mục",
          title: "Danh mục",
          headerShadowVisible: false,
          drawerIcon: () => <Ionicons name="folder-outline" size={24} color="#000" />,
        }}
        component={CategoryAdmin}
      />
      <Drawer.Screen
        name="AdminProduct"
        options={{
          drawerLabel: "Sản phẩm",
          title: "Sản phẩm",
          headerShadowVisible: false,
          drawerIcon: () => <Ionicons name="basket-outline" size={24} color="#000" />,
        }}
        component={ProductAdmin}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  profileContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E8', 
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 999,
    marginBottom: 12,
  },
  emptyAvatar: {
    width: 100,
    height: 100,
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
    fontSize: 18,
    fontWeight: "bold",
    color: '#000', 
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 100,
    padding: 10,
    marginVertical: 10, 
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333', 
  },
  logoutContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
});
