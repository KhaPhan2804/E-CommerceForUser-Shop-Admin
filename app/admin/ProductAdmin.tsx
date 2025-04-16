import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import supabase from '../database/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Picker } from '@react-native-picker/picker';

interface Product {
  id: number | null;
  name: string;
  detail: string;
  price: string;
  image: string;
  rating: string;
  productCategory: string;
}

interface Category {
  id: number;
  name: string;
  image: string;
}

const ProductAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Product>({
    id: null,
    name: '',
    detail: '',
    price: '',
    image: '',
    rating: '',
    productCategory: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('Product').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching products', errorMessage);
    }
  };

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

  const getCategoryNameById = (productCategory: string) => {
    const category = categories.find((cat) => cat.id === Number(productCategory));
    return category ? category.name : 'No category';
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
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
      const uri = pickerResult.assets[0].uri;
      setSelectedImage(uri);
      await uploadImage(uri);
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

      setFormData((prevData) => ({
        ...prevData,
        image: publicUrlData.publicUrl,
      }));
      Alert.alert('Hình ảnh đã được chọn!');
    } catch (error) {
      Alert.alert('Upload Failed', 'There was an error uploading the image.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.productCategory) {
      Alert.alert('Vui lòng điền đầy đủ thông tin sản phẩm');
      return;
    }

    try {
      if (formData.id) {
        // Update the product
        const { error } = await supabase
          .from('Product')
          .update({
            name: formData.name,
            detail: formData.detail,
            price: formData.price,
            image: formData.image,
            rating: formData.rating,
            productCategory: formData.productCategory,
          })
          .eq('id', formData.id);

        if (error) throw error;

        Alert.alert('Sản phẩm đã được cập nhật!');
      } else {
        // Insert new product
        const { error } = await supabase
          .from('Product')
          .insert([{
            name: formData.name,
            detail: formData.detail,
            price: formData.price,
            image: formData.image,
            rating: formData.rating,
            productCategory: formData.productCategory,
          }]);

        if (error) throw error;

        Alert.alert('Sản phẩm đã được thêm!');
      }

      setFormData({
        id: null,
        name: '',
        detail: '',
        price: '',
        image: '',
        rating: '',
        productCategory: '',
      });

      fetchProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error saving product', errorMessage);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      detail: product.detail,
      price: product.price,
      image: product.image,
      rating: product.rating,
      productCategory: product.productCategory,
    });
    setSelectedImage(product.image);
  };

  const handleDelete = async (productId: number) => {
    const confirmation = await Alert.alert(
      'Xóa sản phẩm',
      'Bạn có chắc chắn muốn xóa sản phẩm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', onPress: async () => {
            try {
              const { error } = await supabase
                .from('Product')
                .delete()
                .eq('id', productId);

              if (error) throw error;
              Alert.alert('Sản phẩm đã được xóa!');
              fetchProducts();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              Alert.alert('Error deleting product', errorMessage);
            }
          }
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quản lý sản phẩm</Text>
      <TextInput
        style={styles.input}
        placeholder="Tên sản phẩm"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Mô tả sản phẩm"
        value={formData.detail}
        onChangeText={(text) => setFormData({ ...formData, detail: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Giá"
        value={formData.price.toString()}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Đánh giá"
        value={formData.rating.toString()}
        onChangeText={(text) => setFormData({ ...formData, rating: text })}
      />
      <Button title="Chọn ảnh" onPress={handleImagePick} />
      {selectedImage && <Image source={{ uri: selectedImage }} style={styles.selectedImage} />}
      <Text>Chọn danh mục sản phẩm</Text>
      <Picker
        selectedValue={formData.productCategory}
        onValueChange={(itemValue) =>
          setFormData({ ...formData, productCategory: itemValue })
        }>
        <Picker.Item label="Chọn danh mục" value="" />
        {categories.map((category) => (
          <Picker.Item key={category.id} label={category.name} value={category.id.toString()} />
        ))}
      </Picker>
      <Button title={formData.id ? "Cập nhật sản phẩm" : "Thêm sản phẩm"} onPress={handleSubmit} />

      <View style={styles.productsContainer}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text>{product.detail}</Text>
              <Text>Giá: {product.price}</Text>
              <Text>Đánh giá: {product.rating}</Text>
              <Text>Danh mục: {getCategoryNameById(product.productCategory)}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={() => handleEdit(product)} 
                style={[styles.button, styles.edit]}
              >
                <Text style={styles.buttonText}>CHỈNH SỬA </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDelete(product.id as number)} 
                style={[styles.button, styles.delete]}
              >
                <Text style={styles.buttonText}>XÓA</Text>
              </TouchableOpacity>
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
  selectedImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  productsContainer: {
    marginTop: 20,
  },
  productCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#fff',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10, 
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 100,
    height: 40,
    marginVertical: 5,
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    width: 100,
    height: 40,
    marginVertical: 5,
    backgroundColor: '#F44336',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  edit: {
    backgroundColor: '#4CAF50',
  },
  delete: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    width: 100,
    height: 40,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
});



export default ProductAdmin;
