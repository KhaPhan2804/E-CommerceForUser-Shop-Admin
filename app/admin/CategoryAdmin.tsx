import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, Alert, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import supabase from '../database/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryAdminScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<{ id: number; name: string; image: string }[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('Category').select('*');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async () => {
    if (!categoryName.trim() || !categoryImage.trim()) {
      Alert.alert('Thông báo', 'Không thể để trống tên hoặc ảnh danh mục');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Category')
        .insert([{ name: categoryName, image: categoryImage }]);
      if (error) throw error;
      setCategories((prev) => [...prev, ...(data || [])]);
      setCategoryName('');
      setCategoryImage('');
      setSelectedImage(null);
      await fetchCategories();
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : String(error));
    }
  };

  const updateCategory = async () => {
    if (!categoryName.trim() || !categoryImage.trim()) {
      Alert.alert('Thông báo', 'Không thể để trống tên hoặc ảnh danh mục');
      return;
    }

    try {
      const { error } = await supabase
        .from('Category')
        .update({ name: categoryName, image: categoryImage })
        .eq('id', editId);
      if (error) throw error;
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editId ? { ...cat, name: categoryName, image: categoryImage } : cat
        )
      );
      setCategoryName('');
      setCategoryImage('');
      setEditId(null);
      setSelectedImage(null);
      await fetchCategories();
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : String(error));
    }
  };

  const deleteCategory = async (id: number) => {
    Alert.alert('Xác nhận', 'Bạn có muốn xóa danh mục này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('Category').delete().eq('id', id);
            if (error) throw error;
            setCategories((prev) => prev.filter((cat) => cat.id !== id));
            await fetchCategories();
          } catch (error) {
            Alert.alert('Lỗi', error instanceof Error ? error.message : String(error));
          }
        },
      },
    ]);
  };

  const handleEdit = (category: { id: number; name: string; image: string }) => {
    setCategoryName(category.name);
    setCategoryImage(category.image);
    setEditId(category.id);
    setSelectedImage(category.image);
  };

  const handleSubmit = () => {
    if (editId) {
      updateCategory();
    } else {
      addCategory();
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Bạn cần cho phép truy cập thư viện ảnh');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const selectedUri = pickerResult.assets[0].uri;
      setSelectedImage(selectedUri);
      await uploadImage(selectedUri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const fileInfo = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const byteCharacters = atob(fileInfo);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const fileName = `images/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setCategoryImage(publicUrlData.publicUrl);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý danh mục</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Tên danh mục"
        value={categoryName}
        onChangeText={setCategoryName}
      />
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>Chọn ảnh</Text>
      </TouchableOpacity>
      {selectedImage && <Image source={{ uri: selectedImage }} style={styles.selectedImage} />}
      {uploading && <Text style={{ textAlign: 'center', marginBottom: 10 }}>Đang tải ảnh...</Text>}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{editId ? 'Cập nhật' : 'Thêm'} danh mục</Text>
      </TouchableOpacity>

      {categories.map((item) => (
        <View key={item.id} style={styles.categoryItem}>
          <Image source={{ uri: item.image }} style={styles.categoryImage} />
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Text style={styles.editText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCategory(item.id)}>
                <Text style={styles.deleteText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20, 
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2, 
  },
  headerTitle: {
    fontSize: 20,
  fontWeight: '600',
  color: '#1F2937',
  marginLeft: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageButton: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  imageButtonText: {
    color: '#0284C7',
    fontWeight: '600',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
  },
  editText: {
    color: '#10B981',
    fontWeight: '600',
  },
  deleteText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});