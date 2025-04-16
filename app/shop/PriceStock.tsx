import { View, Text, Image, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import ParamList from '../navigation/Data';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../database/supabase';

type PriceStockRouteProp = RouteProp<ParamList, 'PriceStock'>;

type Product = {
  image: string;
  name: string;
  price: number;
  Stock: number;
};

export default function PriceStock() {
  const route = useRoute<PriceStockRouteProp>();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [updatedPrice, setUpdatedPrice] = useState('');
  const [updatedStock, setUpdatedStock] = useState('');

  const { productId } = route.params;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const cleanPriceInput = (text: string) => {
    return text.replace(/\D/g, ''); 
  };

  const fetchProduct = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('Product')
      .select('image, name, price, Stock')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
    } else {
      setProduct(data);
      setUpdatedPrice(data.price.toString());
      setUpdatedStock(data.Stock.toString());
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  const handleUpdate = async () => {
    if (!updatedPrice || !updatedStock) return;

    const { error } = await supabase
      .from('Product')
      .update({ price: parseInt(updatedPrice), Stock: parseInt(updatedStock), status: 'Instock' })
      .eq('id', productId);

    if (error) {
      console.error('Error updating product:', error);
    } else {
      fetchProduct(); 
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa nhanh</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="black" />
      ) : product ? (
        <View style={styles.card}>
          
          <View style={styles.row}>
            <Image source={{ uri: product.image }} style={styles.image} />
            <Text style={styles.productName}>{product.name}</Text>
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.label}>Giá</Text>
            <Text style={styles.label}>Tồn kho</Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={formatPrice(Number(updatedPrice))} 
              onChangeText={(text) => setUpdatedPrice(cleanPriceInput(text))}
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={updatedStock}
              onChangeText={setUpdatedStock}
            />
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Cập nhật</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    color: '#777',
    flex: 1,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#111',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'red',
  },
});