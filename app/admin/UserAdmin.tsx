import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import supabase from '../database/supabase'; 
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type navigationProp = NativeStackNavigationProp<ParamList, 'AdminUserDetail'>;

interface User {
  MaKH: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  avatar: string;
  roleID: number;
  userID: string;
}

export default function UserAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const navigation = useNavigation<navigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [roleID, setRoleID] = useState<number>(0);


  useEffect(() => {
    fetchUsers();
    fetchRoleID();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('Khachhang').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching users', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoleID = async () =>{
    setIsLoading(true);
    try{
      const {data, error } = await supabase.auth.getSession();
      if(error){
        console.log('Error fetching session:', error.message);
        setIsLoading(false);
        return;
      }

      if(data?.session?.user){
        const userData = data.session.user;

        const { data: userProfileData, error: userProfileError } = await supabase
        .from('Khachhang')
        .select('roleID')
        .eq('email', userData.email)
        .single();

        if (userProfileError) {
          console.log('Error fetching user data from Khachhang:', userProfileError.message);
          setIsLoading(false);
          return;
        }

        if(userProfileData){
          setRoleID(userProfileData.roleID);
        }
      }

    } finally {
      setIsLoading(false);
    }
  }

  const handleBlockUser = async (userID: string) => {
    const selectedUser = users.find((user) => user.userID === userID);
  
    if (selectedUser?.roleID === 3) {
      Alert.alert('Không thể cấm host admin');
      return;
    }
  
    Alert.alert(
      'Cấm người dùng',
      'Bạn có chắc là muốn cấm người dùng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'CẤM',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('Khachhang')
                .update({ roleID: '0' }) 
                .eq('userID', userID);
              if (error) console.log(error);
              Alert.alert('Người dùng đã bị cấm!');
              fetchUsers();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Lỗi cấm người dùng', errorMessage);
            }
          },
        },
      ]
    );
  };
  

  const handleGrantRole = async (userID: string) => {
    const selectedUser = users.find((user) => user.userID === userID);
  
    if (roleID !== 3) {
      Alert.alert('Chỉ host admin mới có thể cấp quyền.');
      return;
    }
  
    if (selectedUser?.roleID === 3) {
      Alert.alert('Không thể thay đổi quyền của host admin.');
      return;
    }
  
    Alert.alert(
      'Cấp quyền quản trị viên',
      'Bạn có chắc muốn cấp quyền admin cho người dùng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Cấp quyền',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('Khachhang')
                .update({ roleID: '2' }) 
                .eq('userID', userID);
              if (error) throw error;
              Alert.alert('Đã cấp quyền quản trị viên!');
              fetchUsers();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Lỗi cấp quyền', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleUnbanUser = async (userID: string) => {
    const selectedUser = users.find((user) => user.userID === userID);

    if (selectedUser?.roleID === 3) {
      Alert.alert('Không thể gỡ cấm host admin');
      return;
    }

    Alert.alert(
      'Gỡ Cấm người dùng',
      'Bạn có chắc là muốn gỡ cấm người dùng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'GỠ CẤM',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('Khachhang')
                .update({ roleID: '1' }) 
                .eq('userID', userID);
              if (error) console.log(error);
              Alert.alert('Người dùng đã được gỡ cấm!');
              fetchUsers();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Lỗi gỡ cấm người dùng', errorMessage);
            }
          },
        },
      ]
    );
  };
  

  

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Quản lý người dùng</Text>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.container}>
        {users.map((user) => (
          <View key={user.userID} style={styles.userCard}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text>Email: {user.email}</Text>
              <Text>SĐT: {user.phone}</Text>
              <Text>Địa chỉ: {user.address}</Text>
              <Text>Role ID: {user.roleID}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.blockButton}
                onPress={() => handleBlockUser(user.userID)}
              >
                <Text style={styles.buttonText}>CẤM</Text>
              </TouchableOpacity>
              {user.roleID === 0 && (
                <TouchableOpacity
                  style={styles.unbanButton}
                  onPress={() => handleUnbanUser(user.userID)}
                  >
                    <Text style={styles.buttonText}>GỠ CẤM</Text>
                  </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.grantRoleButton}
                onPress={() => handleGrantRole(user.userID)}
              >
                <Text style={styles.buttonText}>CẤP QUYỀN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => navigation.navigate('AdminUserDetail', {userId: user.userID})}
              >
                <Text style={styles.buttonText}>XEM CHI TIẾT</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  userCard: {
    flexDirection: 'row',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  blockButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    width: 120,
    alignItems: 'center',
  },
  unbanButton: {
    backgroundColor: '#81c784',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    width: 120,
    alignItems: 'center',
  },
  grantRoleButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    width: 120,
    alignItems: 'center',
  },
  viewDetailsButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
    width: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
