import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ParamList from '../navigation/Data';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { RouteProp, useRoute } from '@react-navigation/native';

type navigationProp = NativeStackNavigationProp<ParamList, 'ShopSetting'>;

type ShopSettingRouteProp = RouteProp<ParamList, 'ShopSetting'>;

type User = {
  shopname: string;
  shopavatar: string;
} | null;

export default function ShopSetting() {
  const navigation = useNavigation<navigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User>(null);
  const [shopName, setShopName] = useState('');
  const [shopAvatar, setShopAvatar] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const route = useRoute<ShopSettingRouteProp>();


  const {idShop} = route.params;
    

  const fetchShopData = async () => {
    setIsLoading(true);
    

      const { data: shopProfile, error: shopProfileError } = await supabase
        .from('shop')
        .select('shopname, shopavatar')
        .eq('id', idShop)
        .single();
      
      if (shopProfileError) {
        console.log('Error fetching user data:', shopProfileError.message);
        setIsLoading(false);
        return;
      }
      
      if (shopProfile) {
        setUser(shopProfile);
        setShopName(shopProfile.shopname);
        setShopAvatar(shopProfile.shopavatar);
      }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Lỗi', 'Tên shop không được để trống');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session?.user) {
      console.log('Error fetching session:', error?.message);
      setIsLoading(false);
      return;
    }

    const userData = data.session.user;
    const { error: updateError } = await supabase
      .from('Khachhang')
      .update({ nameShop: shopName, avatar: shopAvatar })
      .eq('email', userData.email);
    
    if (updateError) {
      Alert.alert('Cập nhật thất bại', 'Vui lòng thử lại sau');
    } else {
      Alert.alert('Thành công', 'Thông tin shop đã được cập nhật');
      navigation.goBack();
    }
    setIsLoading(false);
  };

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

    setUploading(true);

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

      const fileName = `avatarShop/${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;

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
      const newAvatarUrl = publicUrlData.publicUrl;
      const { error: updateError} = await supabase
      .from('Khachhang')
      .update({shopAvatar: newAvatarUrl})
      .eq('userID',userId);
      if (updateError) {
        throw updateError;
      }
      setShopAvatar(newAvatarUrl);
      Alert.alert('Cập nhật ảnh thành công', 'Hình ảnh của bạn đã được cập nhật');
    } catch (error) {
      Alert.alert('Cập nhật ảnh không thành công', 'Đã có vấn đề xảy ra khi cập nhật ảnh');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.header}>Cài đặt Shop</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#333" style={styles.loader} />
        ) : (
          <View style={styles.content}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              {shopAvatar ? (
                <Image source={{ uri: shopAvatar }} style={styles.avatar} />
              ) : (
                <Ionicons name="camera" size={50} color="#ccc" />
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="pencil" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={styles.cardContainer}>
              <Text style={styles.cardLabel}>Tên Shop</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="Tên shop"
                value={shopName}
                onChangeText={setShopName}
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f8f8', 
    alignItems: 'center' 
  },

  headerCard: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    width: '100%',
    backgroundColor: '#fff' 
  },

  goBackButton: { 
    marginRight: 15 
  },

  header: { 
    fontSize: 22,
    fontWeight: '600', 
    color: '#333' 
  },

  loader: { 
    marginTop: 100 
  },

  content: { 
    alignItems: 'center', 
    marginTop: 50, 
    width: '100%' 
  },

  avatarContainer: { 
    width: 120, 
    height: 120, 
    backgroundColor: '#eee', 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden',
    marginBottom: 20,  
    padding: 15,  
    position: 'relative',  
    borderRadius: 10,
    borderWidth: 0.2,
  },

  avatar: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 10, 
  },

  editIconContainer: {
    position: 'absolute',
    bottom: 5,  
    right: 5,   
    backgroundColor: '#333',  
    borderRadius: 50,  
    padding: 5,    
  },

  cardContainer: {
    width: '90%',
    padding: 20,  
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,  
  },

  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  cardInput: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },

  saveButton: { 
    marginTop: 20, 
    backgroundColor: '#333', 
    padding: 12, 
    borderRadius: 8 
  },

  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  }
});