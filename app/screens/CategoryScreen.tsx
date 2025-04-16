import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ParamList } from '../navigation/Data';
import { RouteProp } from '@react-navigation/native';
import supabase from '../database/supabase';
import FeaturedProduct from '../components/featuredProduct';
import { useNavigation } from 'expo-router';
import * as Icon from 'react-native-feather';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  detail: string;
  rating: number;
};

type navigationProp = RouteProp<ParamList, 'Category'>;

type props = {
  route: navigationProp;
};

export default function CategoryScreen({ route }: props) {
  const { categoryId, categoryName } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('productCategory', categoryId)
        .eq('status','Instock');

      if (error) {
        console.error('Error', error);
      } else {
        setProducts(data);
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [categoryId]);

  return (
    <View style={style.container}>
      <View style={style.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={style.goBackButton}>
          <Icon.ArrowLeft strokeWidth={3} stroke="#333" />
        </TouchableOpacity>
        <Text style={style.headerTitle}>Sản phẩm {categoryName.toLowerCase()}</Text>
      </View>


      {isLoading ? (
        <View style={style.loadingContainer}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.productList}>
        <View style={style.row}>
          {products.length > 0 ? (
            products.map((item) => (
              <FeaturedProduct
                key={item.id}
                id={item.id}
                name={item.name}
                detail={item.detail}
                price={item.price}
                image={item.image}
                rating={item.rating}
              />
            ))
          ) : (
            <Text style={style.noProductsText}>-- Loại sản phẩm {categoryName.toLowerCase()} này chưa có --</Text>
          )}
        </View>
      </ScrollView>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333', 
  },
  productList: {
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noProductsText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
    marginLeft: 65,
  },
  goBackButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#efefef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
