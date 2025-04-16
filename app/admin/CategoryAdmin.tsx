import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, Image, StyleSheet, ScrollView } from 'react-native';
import supabase from '../database/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function CategoryAdminScreen  ()  {
  const [categories, setCategories] = useState<{ id: number; name: string; image: string }[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('Category').select('*');
      if (error) throw error;
      setCategories(data || []); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching categories', errorMessage);
    }
  };

  const addCategory = async () => {
    if (!categoryName.trim() || !categoryImage.trim()) {
      Alert.alert('Không thể để trống tên hoặc ảnh danh mục');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('Category')
        .insert([{ name: categoryName, image: categoryImage }]);
      if (error) throw error;
      setCategories((prev) => [...(prev || []), ...(data || [])]); 

      setCategoryName('');
      setCategoryImage('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error adding category', errorMessage);
    }
  };

  const updateCategory = async () => {
    if (!categoryName.trim() || !categoryImage.trim()) {
      Alert.alert('Không thể để trống tên hoặc ảnh danh mục');
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error updating category', errorMessage);
    }
  };

  const deleteCategory = async (id: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có muốn xóa danh mục này?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              const { error } = await supabase.from('Category').delete().eq('id', id);
              if (error) throw error;
              setCategories((prev) => prev.filter((cat) => cat.id !== id));
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Error deleting category', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (category: { id: number; name: string; image: string }) => {
    setCategoryName(category.name);
    setCategoryImage(category.image);
    setEditId(category.id);
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
    if (permissionResult.granted === false) {
      alert('Permission to access gallery is required!');
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
      const fileUri = uri;
      const fileInfo = await FileSystem.readAsStringAsync(fileUri, {
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

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);

      setCategoryImage(publicUrlData.publicUrl); 
      Alert.alert('Hình ảnh đã được chọn!');
    } catch (error) {
      Alert.alert('Upload Failed', 'There was an error uploading the image.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quản lý danh mục</Text>
      <TextInput
        style={styles.input}
        placeholder="Tên danh mục"
        value={categoryName}
        onChangeText={setCategoryName}
      />
      <Button title="Chọn ảnh" onPress={pickImage} />
      {selectedImage && !uploading && <Image source={{ uri: selectedImage }} style={styles.selectedImage} />}
      {uploading && <Text>Uploading...</Text>}
      <Button title={editId ? 'Cập nhật danh mục' : 'Thêm danh mục'} onPress={handleSubmit} />
      <View>
        {categories.map((item) => (
          <View key={item.id} style={styles.categoryItem}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.details}>
              <Text>{item.name}</Text>
              <View style={styles.actions}>
                <Button title="Chỉnh sửa"color={'#4CAF50'} onPress={() => handleEdit(item)} />
                <Button
                  title="Xóa"
                  color="red"
                  onPress={() => deleteCategory(item.id)}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  selectedImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  details: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});


