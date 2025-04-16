import { View, StyleSheet, TouchableOpacity, ScrollView, Text, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Icon from 'react-native-feather';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import FeaturedCategory from '../components/featuredCategory';
import FeaturedProduct from '../components/featuredProduct';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamList } from '../navigation/Data';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

type navigationProp = NativeStackNavigationProp<ParamList, 'Cart'>;

type quantity = {
  quantity: number,
};

type Product = {
  id: number;
  name: string;
  price: number;
  detail: string;
  image:string;
  rating: number | 0;
};

export default function HomeScreen() {
  const navigation = useNavigation<navigationProp>();
  const [product, setProduct] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState<quantity>({ quantity: 0 });

  const fetchProduct = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
    .from('Product')
    .select('*')
    .eq('status','Instock');
    
    if (error) {
      console.error('Error: ', error);
    } else {
      setProduct(data);
    }
    setIsLoading(false);
  };

  const fetchQuantity = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.refreshSession();
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.session?.user) {
        await supabase.auth.signOut();
        return;
      }

      const userId = session.session.user.id;
      const { data, error } = await supabase.from('Khachhang').select('MaKH').eq('userID', userId).single();

      if (error || !data?.MaKH) {
        console.error('Error fetching MaKH for the user');
        return;
      }

      const maKH = data.MaKH;
      const { data: cartData, error: cartError } = await supabase.from('Cart').select('*').eq('MaKH', maKH);

      if (cartError) {
        console.error('Error fetching cart data:', cartError);
        return;
      }

      const uniqueProducts = new Set(cartData?.map(item => item.id));
      const totalQuantity = uniqueProducts.size;
      setQuantity({ quantity: totalQuantity });
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
      fetchQuantity();
    }, [])
  );
  
  const handleSearch = () => {
    navigation.navigate('SearchUser');
  }

  return (
    <SafeAreaView style={style.container}>
      {isLoading ? (
        <View style={style.loadingContainer}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      ) : (
        <>
          <View style={style.headerContainer}>
            <TouchableOpacity style={style.searchContainer} onPress={handleSearch}>
              <Icon.Search height={20} width={20} color="#999" style={style.searchIcon} />
              <Text style={style.searchInput}>Tìm kiếm sản phẩm...</Text>
            </TouchableOpacity>
            <View style={style.cartContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
                <View style={style.cartIconWrapper}>
                <Ionicons name="cart-outline" size={24} color="#333" />
                  {quantity.quantity > 0 && (
                    <Text style={style.cartQuantity}>
                      {quantity.quantity > 99 ? '99+' : quantity.quantity}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              <View style={style.cartIconWrapper}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#333" />
                  {quantity.quantity > 0 && (
                    <Text style={style.cartQuantity}>
                      {quantity.quantity > 99 ? '99+' : quantity.quantity}
                    </Text>
                  )}
                </View>
            </View>
          </View>
          <View style={style.itemContainer}>
            <Image style={style.itemImg} source={require('../image/fightclub.png')} />
          </View>
          <View style={style.categoryContainer}>
            <FeaturedCategory />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.productList}>
            <View style={style.row1}>
              {product.length > 0 ? (
                product.map((item, index) => (
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
                <Text style={style.noResults}>Không có sản phẩm nào</Text>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop:10,
  },
  searchContainer: {
    flex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 5
  },
  searchInput: {
    flex: 3,
    fontSize: 16,
    color: '#333'
  },
  cartContainer: {
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  cartIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartQuantity: {
    position: 'absolute',
    top: -10,
    right: -3,
    color: 'red',
    fontSize: 15,
    fontWeight: 'bold'
  },
  itemContainer: {
    marginTop: 8,
    paddingLeft: 5
  },
  itemImg: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0'
  },
  categoryContainer: {
    paddingTop: 8,
    paddingLeft: 12,
    paddingRight: 12
  },
  noResults: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20
  },
  row1: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20
  },
  productList: {
    paddingBottom: 20
  }
});
