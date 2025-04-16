import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import supabase from '../database/supabase';

type PendingRouteProp = RouteProp<ParamList, 'Rating'>;

type Orders = {
  id: number;
  quantity: number;
  totalCost: number;
  productID: number;
  shipfee: number;
  order_id: string;
};

type Product = {
  id: number;
  name: string;
  image: string;
};

export default function RatingScreen() {
  const route = useRoute<PendingRouteProp>();
  const navigation = useNavigation();
  const { MaKH } = route.params;

  const [orders, setOrders] = useState<Orders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isRatingVisible, setIsRatingVisible] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null); 

  useEffect(() => {
    fetchOrders();
  }, [MaKH]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Donhang')
        .select('*')
        .eq('MaKH', MaKH)
        .eq('status', 'Đánh giá');
      
      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data);
        fetchProductData(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductData = async (orders: Orders[]) => {
    const productIds = orders.map((order) => order.productID);
    try {
      const { data, error } = await supabase
        .from('Product') 
        .select('id, name, image')
        .in('id', productIds);
      
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const getProductDetails = (productID: number) => {
    const product = products.find((prod) => prod.id === productID);
    return product ? product : null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleRatingSubmit = async () => {
    if (selectedRating === null || comment.trim() === '') {
      alert('Please select a rating and provide a comment.');
      return;
    }
  
    try {

      const order = orders.find(order => order.id === selectedOrder);
      if (!order) {
        alert('Order not found.');
        return;
      }
      
      const productId = order.productID;

      const { data: productData, error: productError } = await supabase
      .from('Product')
      .select(' Sold')
      .eq('id', productId)
      .single();

      if (productError) {
        console.error('Error fetching product data:', productError);
        return;
      }

      const { Sold } = productData;

      const { data: ordersForProduct, error: ordersError } = await supabase
      .from('Donhang')
      .select('rating')
      .eq('productID', productId)
      .eq('status', 'Hoàn thành');  // Assuming only completed orders have ratings

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
      }

      const totalRating = ordersForProduct.reduce((sum, order) => sum + (order.rating || 0), 0);
      const totalSold = ordersForProduct.length;


      const newRatingTotal = totalRating + selectedRating;
      
      const updatedSold = totalSold;

      let newAverageRating = selectedRating; 
      if (updatedSold > 0) {
      newAverageRating = newRatingTotal / updatedSold;
      }

      if (!newAverageRating || isNaN(newAverageRating)) {
      console.error('Invalid new average rating:', newAverageRating);
      return;
      }         

      const { error: updateOrderError } = await supabase
        .from('Donhang') 
        .update({
          rating: selectedRating,
          ratingcontent: comment,
          status: 'Hoàn thành', 
        })
        .eq('id', selectedOrder); 
  
      if (updateOrderError) {
        console.error('Error updating rating and comment:', updateOrderError);
      } 

      const { error: updateProductError } = await supabase
      .from('Product')
      .update({
        rating: newAverageRating,
      })
      .eq('id', productId);

    if (updateProductError) {
      console.error('Error updating product rating:', updateProductError);
      return;
    }

    alert('Rating submitted successfully!');
    setIsRatingVisible(false);
    fetchOrders(); 

    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const renderOrderCard = (item: Orders) => {
    const product = getProductDetails(item.productID);
    if (!product) return null;

    return (
      <View style={styles.card} key={item.id}>
        <Text style={styles.cardTitle}>Đơn hàng #{item.order_id}</Text>
        <View style={styles.productContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productDetails}>
            <Text style={styles.cardDetails}>Sản phẩm: {product.name}</Text>
            <Text style={styles.cardDetails}>Số lượng: {item.quantity}</Text>
            <Text style={styles.cardDetails}>Tổng chi phí: {formatPrice(item.totalCost + item.shipfee)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.receivedButton} 
          onPress={() => {
            setSelectedOrder(item.id);
            setIsRatingVisible(true);
          }}
        >
          <Text style={styles.receivedButtonText}>Đánh giá sản phẩm</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRatingSection = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>Chọn đánh giá (1-5 sao):</Text>
        <View style={styles.starRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
              <Ionicons
                name={star <= (selectedRating ?? 0) ? 'star' : 'star-outline'}
                size={24}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.commentInput}
          placeholder="Viết đánh giá của bạn..."
          multiline
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleRatingSubmit}>
          <Text style={styles.submitButtonText}>Gửi Đánh Giá</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.cardList}>
          {orders.length === 0 ? (
            <Text style={styles.noOrdersText}>-- Không có đơn hàng nào đang đợi đánh giá --</Text>
          ) : (
            orders.map(renderOrderCard)
          )}
        </ScrollView>
      )}

      {isRatingVisible && renderRatingSection()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  noOrdersText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
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
  loader: {
    marginTop: 20,
  },
  cardList: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  productDetails: {
    flex: 1,
  },
  cardDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  receivedButton: {
    borderColor: '#4CAF50',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  receivedButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  ratingText: {
    fontSize: 16,
    marginBottom: 10,
  },
  starRating: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 80,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
