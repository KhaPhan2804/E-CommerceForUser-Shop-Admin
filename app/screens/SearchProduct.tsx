import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import supabase from '../database/supabase';
import FeaturedProduct from '../components/featuredProduct';
import { Ionicons } from '@expo/vector-icons';

export default function SearchProduct() {
  const { params } = useRoute();
  const { searchTerm } = params as { searchTerm: string };
  const navigation = useNavigation();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('Product') 
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('status', 'Instock');

      if (error) {
        console.log('Error fetching products:', error.message);
      } else {
        setProducts(data);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [searchTerm]);

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <View style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </View>
        </TouchableWithoutFeedback>
        <Text style={styles.headerTitle}>Kết quả tìm kiếm</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.productList}>
          <View style={styles.row1}>
            {products.length > 0 ? (
              products.map((item, index) => (
                <FeaturedProduct
                  key={index}
                  id={item.id}
                  name={item.name}
                  detail={item.detail}
                  price={item.price}
                  image={item.image}
                  rating={item.rating}
                />
              ))
            ) : (
              <View style={styles.noResultsWrapper}>
                <Text style={styles.noResults}>Không có sản phẩm nào</Text>
                <View style={styles.blackLine} />
                <Text style={styles.suggestionLabel}>Sản phẩm bạn có thể thích</Text>
                <ScrollView style={styles.suggestionScrollView}>
                  <View style={styles.suggestionItem}>
                    <Text>Suggested item 1</Text>
                  </View>
                  <View style={styles.suggestionItem}>
                    <Text>Suggested item 2</Text>
                  </View>
                  <View style={styles.suggestionItem}>
                    <Text>Suggested item 3</Text>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    height: 60,  // Set header height
  },
  backButton: {
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  productList: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  row1: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginTop: 10,
  },
  noResultsWrapper: {
    alignItems: 'center',
    marginBottom: 20, 
    width: "100%",
  },
  noResults: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '600',
  },
  blackLine: {
    height: 3,  
    backgroundColor: 'black',
    width: "100%",  
    marginVertical: 10,  
  },
  suggestionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginVertical: 5,
  },
  suggestionScrollView: {
    width: '100%',
    marginTop: 5, 
  },
  suggestionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});
