import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as Icon from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamList } from '../navigation/Data';
import supabase from '../database/supabase';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';



interface CartItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  MaKH: string;
  productID: number;
  shopId: number;
  stock: number;
}

type navigationProp = NativeStackNavigationProp<ParamList, 'Order'>;

const formatPrice = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'VND',
});

export default function CartScreen() {
  const navigation = useNavigation<navigationProp>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shopId, setShopIds] = useState<Record<number, number>>({}); 
  const [stockQuantities, setStockQuantities] = useState<Record<number, number>>({});

  const isCartEmpty = cartItems.length === 0;

  useFocusEffect(
    React.useCallback(() => {
      const fetchCartItems = async () => {
        setIsLoading(true); 
        try {
          const { data: session, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session?.session?.user) {
            console.error('Error fetching session or user not authenticated');
            return;
          }

          const userId = session.session.user.id;

          const { data, error } = await supabase
            .from('Khachhang')
            .select('MaKH')
            .eq('userID', userId)
            .single();

          if (error || !data?.MaKH) {
            console.error('Error fetching MaKH for the user');
            return;
          }

          const maKH = data.MaKH;

          const { data: cartData, error: cartError } = await supabase
          .from('Cart')
          .select('*')
          .eq('MaKH', maKH); 


          if (cartError) {
            console.error('Error fetching cart data:', cartError);
            return;
          }

          if (cartData) {
            setCartItems(cartData);
            cartData.forEach(async (item: CartItem) => {
              await fetchProductDetails(item.productID); 
            });
          }
        } catch (err) {
          console.error('Unexpected error:', err);
        } finally {
          setIsLoading(false); 
        }
      };

      fetchCartItems();
      
    }, [])
  );

  const fetchProductDetails = async (productId: number) => {
    try {
      const { data, error } = await supabase
        .from('Product') 
        .select('shopId, Stock') 
        .eq('id', productId) 
        .single();
  
      if (error) {
        console.error('Error fetching product details:', error);
        return;
      }
  
      if (data) {
        setShopIds(prev => ({ 
          ...prev, 
          [productId]: data.shopId 
        })); // Set the shopId mapping
        setStockQuantities(prev => ({ 
          ...prev, 
          [productId]: data.Stock 
        })); // Set the stock quantity mapping
      }
    } catch (err) {
      console.error('Unexpected error fetching product details:', err);
    }
  };

  const handleSelectItem = (itemId: string) => {
    const updatedSelection = new Set(selectedItems);
    if (updatedSelection.has(itemId)) {
      updatedSelection.delete(itemId);
    } else {
      updatedSelection.add(itemId);
    }
    setSelectedItems(updatedSelection);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number, productId: number) => {
    try {
      if (newQuantity < 1) return;
  
      const maxStock = stockQuantities[productId] || 20; // Default max limit if stock is not available
  
      if (newQuantity > maxStock) {
        newQuantity = maxStock;
      }
  
      const updatedItems = cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
  
      setCartItems(updatedItems);
  
      const { error } = await supabase
        .from('Cart')
        .update({ quantity: newQuantity })
        .eq('id', itemId);
  
      if (error) {
        console.error('Error updating quantity:', error);
      }
    } catch (err) {
      console.error('Unexpected error updating quantity:', err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedItems);

      const { error } = await supabase
        .from('Cart')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing item:', error);
      }
    } catch (err) {
      console.error('Unexpected error removing item:', err);
    }
  };

  const selectedCartTotal = Array.from(selectedItems).reduce((total, itemId) => {
    const item = cartItems.find(cartItem => cartItem.id === itemId);
    if (item) {
      return total + item.price * item.quantity;
    }
    return total;
  }, 0);


  const handleBuyNow = async () => {
    try {
      const selectedData = Array.from(selectedItems)
        .map(itemId => {
          const item = cartItems.find(cartItem => cartItem.id === itemId);
          return item ? { 
          productId: item.productID, name: item.productName, price: item.price, image: item.image, quantity: item.quantity, shopId: shopId[item.productID] } : null;
        })
        .filter(item => item != null);
  
      const totalCost = selectedCartTotal;
  
      const { data: session, error } = await supabase.auth.getSession();
  
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
  
      if (session?.session?.user) {
        const userId = session.session.user.id;
  
        const { data, error: customerError } = await supabase
          .from('Khachhang')
          .select('MaKH, address')
          .eq('userID', userId)
          .single();
  
        if (customerError || !data?.MaKH) {
          console.error('Customer ID (MaKH) could not be retrieved');
          return;
        }
  
        const maKH = data.MaKH;
        const address = data.address;
        console.log(selectedData);
        navigation.navigate('Order', { selectedData, totalCost, maKH, address});
      } else {
        console.error('User session is not valid');
      }
    } catch (error) {
      console.error('Error processing the purchase:', error);
    }
  };
  
  

  return (
    <View style={style.container}>
      <View style={style.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={style.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={style.headerTitle}>Giỏ hàng</Text>
      </View>

      {isLoading ? (
        <View style={style.loadingContainer}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      ) : isCartEmpty ? (
        <View style={style.emptyCartContainer}>
          <Text style={style.emptyCartText}>Giỏ hàng của bạn đang trống</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={style.continueShoppingButton}>
            <Text style={style.continueShoppingText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={style.itemsContainer}>
          {cartItems.map(item => (
            <View key={item.id} style={style.cartItem}>
              <TouchableOpacity
                onPress={() => handleSelectItem(item.id)}
                style={[style.checkbox, selectedItems.has(item.id) && style.checkboxSelected]}
              >
                {selectedItems.has(item.id) && (
                  <Icon.Check strokeWidth={3} stroke="#fff" width={15} height={15} />
                )}
              </TouchableOpacity>
              <Image source={{ uri: item.image }} style={style.itemImage} />
              <View style={style.itemDetails}>
                <Text style={style.itemName}>{item.productName}</Text>
                <Text style={style.itemPrice}>{formatPrice.format(item.price)}</Text>
                {stockQuantities[item.productID] !== undefined && stockQuantities[item.productID] < 5 && (
                  <Text style={{ color: 'red', fontSize: 12 }}>
                   Chỉ còn {stockQuantities[item.productID]} sản phẩm
                  </Text>
                )}
                <View style={style.quantityContainer}>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, item.quantity - 1, item.productID)}
                    style={[style.quantityDecreaseButton, item.quantity === 1 && { backgroundColor: '#d3d3d3' }]}
                    disabled={item.quantity === 1}
                  >
                    <Icon.Minus strokeWidth={3} stroke="#fff" width={15} height={15} />
                  </TouchableOpacity>
                  <Text style={style.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, item.quantity + 1, item.productID)}
                    style={[style.quantityIncreaseButton, item.quantity === 20 && { backgroundColor: '#d1e7d7' }]}
                    disabled={item.quantity === 20}
                  >
                    <Icon.Plus strokeWidth={4} stroke="#fff" width={15} height={15} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.id)}
                style={style.removeButton}
              >
                <Ionicons name="trash-bin-outline" size={15} color="#FFF"/>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {!isCartEmpty && !isLoading && (
        <View style={style.summaryContainer}>
          <View style={style.summaryRow}>
            <Text style={style.summaryText}>Tổng đơn hàng:</Text>
            <Text style={style.summaryText}>{formatPrice.format(selectedCartTotal)}</Text>
          </View>
          
          <View style={style.summaryRow}>
            <Text style={style.totalText}>Tổng chi phí:</Text>
            <Text style={style.totalText}>{formatPrice.format(selectedCartTotal)}</Text>
          </View>
          <TouchableOpacity
            onPress={handleBuyNow}
            style={[style.orderButton, selectedItems.size === 0 && { backgroundColor: '#ccc' }]} >
            <Text style={style.orderButtonText}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  itemsContainer: {
    marginTop: 10,
    paddingBottom: 150,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,  
    paddingHorizontal: 5, 
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 10, 
    borderRadius: 15,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: '95%', 
    alignSelf: 'center',
    height: 100, 
  },
  
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight:10,
  },
  checkboxSelected: {
    backgroundColor: '#111111',
  },
  itemImage: {
    marginLeft: 5,
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 5,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#333333',
    marginVertical: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityDecreaseButton: {
    width: 30,
    height: 30,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  quantityIncreaseButton: {
    width: 30,
    height: 30,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
    color: '#333',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#ff4d4d',
    borderRadius: 6,
    marginLeft: 12,
  },
  summaryContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  orderButton: {
    backgroundColor: '#111111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  continueShoppingButton: {
    backgroundColor: '#3e33b5a8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyCartText: {
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
  },
});
