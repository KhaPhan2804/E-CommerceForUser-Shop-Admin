import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import supabase from '../database/supabase'; // Update this import to your actual Supabase client import

interface User {
  MaKH: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  avatar: string;
  roleID: string;
  userID: string;
}

export default function UserAdmin () {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('Khachhang').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching users', errorMessage);
    }
  };

  const handleDelete = async (userID: string) => {
    const confirmation = await Alert.alert(
      'Xóa người dùng',
      'Bạn có chắc là muốn xóa người dùng này?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'XÓA',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('Khachhang')
                .delete()
                .eq('userID', userID);
              if (error) throw error;
              Alert.alert('Người dùng đã bị xóa!');
              
              fetchUsers();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Error deleting user', errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quản lý người dùng</Text>
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
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(user.userID)}
          >
            <Text style={styles.buttonText}>XÓA</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF8E8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


