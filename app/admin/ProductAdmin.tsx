import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type navigationProp = NativeStackNavigationProp<ParamList, 'AdminProductDetail'>;



interface Product {
  id: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<navigationProp>();

  const formatPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'VND',
  });

  const getFormattedRating = (rating: string) => {
    const numericRating = parseFloat(rating);
    return numericRating > 5 ? 5 : numericRating;
  }

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('Product').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching products', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('Category').select('*');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error fetching categories', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryNameById = (productCategory: string) => {
    const category = categories.find((cat) => cat.id === Number(productCategory));
    return category ? category.name : 'No category';
  };

  

  const handleReportViolation = async (productId: number) => {
    try {
      const { error } = await supabase
        .from('Product')
        .update({ status: 'Violate' })
        .eq('id', productId);
  
      if (error) throw error;
  
      Alert.alert('Đã báo cáo', `Sản phẩm ID ${productId} đã được đánh dấu là vi phạm.`);
      fetchProducts(); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Lỗi khi cập nhật trạng thái vi phạm', errorMessage);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#111111" style={styles.loadingIndicator} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Quản lý sản phẩm</Text>
      </View>

      <View style={styles.productsContainer}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text>{product.detail}</Text>
              <Text>Giá: {formatPrice.format(parseFloat(product.price))}</Text>
              <Text>Đánh giá: {getFormattedRating(product.rating)}
                <Ionicons name="star-outline" size={12} color="#FFD700"/>
              </Text>
              <Text>Danh mục: {getCategoryNameById(product.productCategory)}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={() => navigation.navigate("AdminProductDetail",{id: product.id})} 
                style={[styles.button, styles.viewDetails]}
              >
                <Text style={styles.buttonText}>XEM CHI TIẾT</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleReportViolation(product.id as number)} 
                style={[styles.button, styles.reportViolation]}
              >
                <Text style={styles.buttonText}>CẢNH BÁO VI PHẠM</Text>
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
    backgroundColor: '#F9F9F9',
  },
  
  loadingIndicator: {
    marginBottom: 16,
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.8,  
    borderBottomColor: '#000', 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  productsContainer: {
    marginTop: 20,
  },
  productCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 18,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 120,
    height: 40,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    elevation: 3,
  },
  viewDetails: {
    backgroundColor: '#2196F3',  
  },
  reportViolation: {
    backgroundColor: '#FF9800',  
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default ProductAdmin;
