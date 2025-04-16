import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import supabase from '../database/supabase';
import { RouteProp } from '@react-navigation/native';
import ParamList from '../navigation/Data';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

type EditProfileRouteProp = RouteProp<ParamList, 'Edit'>;

export default function EditProfileScreen({ route }: { route: EditProfileRouteProp }) {
  const { name, email, avatar, phone, address, password } = route.params;
  
  const [newName, setNewName] = useState(name);
  const [newEmail, setNewEmail] = useState(email);
  const [newPhone, setNewPhone] = useState(phone);
  const [newAddress, setNewAddress] = useState(address);
  const [newAvatar, setNewAvatar] = useState<string | null>(avatar);
  const [newPassword, setNewPassword] = useState<string>('');  
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log('Error fetching session:', error.message);
        return;
      }
      if (data?.session?.user) {
        setUserId(data.session.user.id);
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, []);
  
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        let selectedImgUrl = result.assets[0].uri;
        setSelectedImage(selectedImgUrl); 
        uploadImage(selectedImgUrl);
      }
    } catch (error) {
      Alert.alert('Không thể tải ảnh lên ', 'Vui lòng thử lại');
    }
  };

  const uploadImage = async (selectedImage: string) => {
    if (!selectedImage) {
      alert('No image selected!');
      return;
    }

    setIsLoading(true);

    try {
      const fileUri = selectedImage;
      const fileInfo = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const byteCharacters = atob(fileInfo);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const fileName = `avatars/${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);

      setNewAvatar(publicUrlData.publicUrl);

      Alert.alert('Cập nhật ảnh thành công', 'Hình ảnh của bạn đã được cập nhật');
    } catch (error) {
      Alert.alert('Cập nhật ảnh không thành công', 'Đã có vấn đề xảy ra khi cập nhật ảnh');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updatedData: any = {
        name: newName,
        email: newEmail,
        avatar: newAvatar,
        phone: newPhone,
        address: newAddress,
      };
  
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword, 
        });
  
        if (passwordError) {
          alert('Vui lòng thử lại!');
          return;
        }
  
        const { data, error: tableError } = await supabase
          .from('Khachhang')
          .update({ password: newPassword })
          .eq('email', newEmail);
  
        if (tableError) {
          alert('Error updating password in user data. Please try again.');
          return;
        }
      }
  
      const { data, error } = await supabase
        .from('Khachhang')
        .update(updatedData)
        .eq('email', newEmail)
        .single();
  
      if (error) {
        alert('Không thể lưu thông tin cập nhật. Vui lòng thử lại!');
      } else {
        alert('Thông tin cá nhân đã được cập nhật!');
  
        const { data: refreshedData, error: fetchError } = await supabase
          .from('Khachhang')
          .select('*')
          .eq('email', newEmail)
          .single();
  
        if (fetchError) {
          console.log('Error fetching updated data:', fetchError.message);
        } else {
          setNewName(refreshedData?.name || '');
          setNewEmail(refreshedData?.email || '');
          setNewPhone(refreshedData?.phone || '');
          setNewAddress(refreshedData?.address || '');
          setNewAvatar(refreshedData?.avatar || '');

          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {isLoading ? <ActivityIndicator size="large" color="#111111" style={styles.loadingContainer}/> : null}
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tùy chỉnh thông tin cá nhân</Text>
      </View>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: newAvatar || '' }} style={styles.profilePicture} />
        <TouchableOpacity onPress={pickImage} style={styles.cameraIconContainer}>
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Nhập họ và tên"
          />
        </View>

        {/* Email Field */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, styles.emailInput]}  
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Nhập email"
            editable={false} 
          />
        </View>

        {/* Phone Field */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="Nhập số điện thoại"
          />
        </View>

        {/* Address Field */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            value={newAddress}
            onChangeText={setNewAddress}
            placeholder="Nhập địa chỉ"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nhập mật khẩu mới"
            secureTextEntry  
          />
        </View>
        <View style={{ marginTop: 0.2, marginBottom: 10 }}>
          <TouchableOpacity onPress={handleSave} style={styles.updateButton}>
            <Text style={styles.buttonText}>Cập nhật</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',  
    alignItems: 'center',
  },
  
  goBack: {
    padding: 8,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    color: '#333',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 30,
    position: 'relative',  
  },
  
  profilePicture: {
    width: 300,
    height: 300,
    borderRadius: 75,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  
  cameraIconContainer: {
    position: 'absolute',  
    bottom: 10,  
    right: 10,  
    backgroundColor: '#111111',  
    padding: 8, 
    borderRadius: 25, 
    elevation: 5,  
    borderWidth: 1,  
    borderColor: '#FFF',  
  },
  
  body: { 
    marginTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingLeft: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emailInput: {
    color: '#aaa',
  },
  updateButton: {
    backgroundColor: '#111111',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,  
    marginBottom: 20,  
    width: '100%',  
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
