import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from 'expo-router';

type navigationProp = NativeStackNavigationProp<ParamList, 'AdminProductDetail'>;
type AdminProductDetailRouteProp = RouteProp<ParamList, 'AdminProductDetail'>;

const formatPrice = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'VND',
});

export default function ProductDetail() {
  const route = useRoute<AdminProductDetailRouteProp>();
  const { id } = route.params;
  
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();

  const getFormattedRating = (rating: string) => {
    const numericRating = parseFloat(rating);
    return numericRating > 5 ? 5 : numericRating;
  }

  useEffect(() => {
    fetchProductDetails(id);
  }, [id]);

  const fetchProductDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setProduct(data);
    } catch (error) {
      Alert.alert('Error fetching product details', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#111111" style={styles.loadingIndicator} />;
  }

  if (!product) {
    return <Text>Product not found</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#333" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Sản phẩm: {product.name}</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text>{product.detail}</Text>
            <Text>Giá: {formatPrice.format(parseFloat(product.price))}</Text>
            <Text>Đánh giá: {getFormattedRating(product.rating)}
              <Ionicons name="star-outline" size={12} color="#FFD700"/>
            </Text>
            <Text>Số lượng bán: {product.Sold}</Text>
            <Text>Đã thích: {product.Liked}</Text>
            <Text>Trạng thái: {product.status}</Text>
            <Text>Kho còn: {product.Stock}</Text>
            <Text>Trọng lượng: {product.Weight} g</Text>
            <Text>Lượt xem: {product.Watched}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9F9F9',
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
  cardContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    resizeMode: 'contain',
  },
  productDetails: {
    marginTop: 16,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#333',
  },
  loadingIndicator: {
    marginTop: 50,
  },
});