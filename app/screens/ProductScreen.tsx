import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { ParamList } from '../navigation/Data';
import Icon from 'react-native-vector-icons/FontAwesome';
import supabase from '../database/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';


const { width } = Dimensions.get('window');
const itemWidth = width ;


type ProductScreenRouteProp = RouteProp<ParamList, 'Product'>;


export default function ProductScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamList, 'ShopInterface'>>();
  const route = useRoute<ProductScreenRouteProp>();
  const { id } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [image, setImage] = useState('');
  const [imageProduct, setImageProduct] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);  
  const [sold, setSold] = useState<number>(0);
  const [liked, setLiked] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLiked, setIsLiked] = useState(false);

  const [idShop, setIdShop] = useState<number>(0);
  const [shopName, setShopName] = useState('');

  const fetchProductData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('id', id)
        .single(); 

      if (error) {
        console.error('Error fetching product data:', error.message);
      } else {
        setProductName(data.name);
        setProductDescription(data.detail); 
        setPrice(data.price);
        setImage(data.image);
        setRating(data.rating)
        setIdShop(data.shopId);
        const images = typeof data.imageProduct === "string"
          ? JSON.parse(data.imageProduct)
          : data.imageProduct;
        setImageProduct(images);
        setSold(data.Sold);
        setLiked(data.Liked);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShopName = async (idShop: number) => {
    setIsLoading(true);
    const { data: shopProfile, error: shopProfileError } = await supabase
    .from('shop')
    .select('shopname')
    .eq('id', idShop)
    .single();
    if (shopProfileError) {
      console.log('Error fetching shop data:', shopProfileError.message);
      setIsLoading(false);
      return;
    }
    if (shopProfile) {
      setShopName(shopProfile.shopname);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchProductData(); 
    fetchShopName(idShop);
    checkIfLiked();
  }, [idShop]);

  const formatPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(price));

  const getMaKHFromUserId = async (userId: string) : Promise<string | null>=> {
    try {
      const { data, error } = await supabase
        .from('Khachhang')
        .select('MaKH')
        .eq('userID', userId)
        .single();

      if (error) throw error;

      return data?.MaKH || null;
    } catch (error) {
      console.error('Error fetching MaKH:', error);
      return null;
    }
  };

  const handleAdd = async () => {
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
  
      const userId = session?.session?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'User not logged in.');
        return;
      }
  
      const maKH = await getMaKHFromUserId(userId);
      if (!maKH) {
        Alert.alert('Error', 'Unable to fetch MaKH for the user.');
        return;
      }
  
      // Fetch product stock
      const { data: product, error: productError } = await supabase
        .from('Product')
        .select('Stock') // Assuming the stock column exists
        .eq('id', id)
        .single();
  
      if (productError || !product) {
        Alert.alert('Error', 'Could not fetch product stock.');
        return;
      }
  
      const stock = product.Stock; 
  
      const { data: existingCartItem, error: fetchError } = await supabase
        .from('Cart')
        .select('id, quantity')
        .eq('MaKH', maKH)
        .eq('productID', id)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
  
      if (existingCartItem) {
        const updatedQuantity = existingCartItem.quantity + quantity;
  
        if (updatedQuantity > stock) {
          Alert.alert('Error', 'Not enough stock available.');
          return;
        }
  
        if (updatedQuantity >= 20) {
          Alert.alert('Error', 'Cannot add more than 20 items of this product.');
          return;
        }
  
        const { error: updateError } = await supabase
          .from('Cart')
          .update({ quantity: updatedQuantity })
          .eq('id', existingCartItem.id);
  
        if (updateError) throw updateError;
        Alert.alert('Success', 'Sản phẩm đã được cập nhật số lượng!');
      } else {
        if (quantity > stock) {
          Alert.alert('Error', 'Not enough stock available.');
          return;
        }
  
        const { error: insertError } = await supabase.from('Cart').insert([{
          productID: id,
          productName: productName,
          quantity: quantity,
          MaKH: maKH,
          price: price,
          image: image,
        }]);
  
        if (insertError) throw insertError;
  
        Alert.alert('Success', 'Thêm vào giỏ hàng thành công!');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add to cart.');
    }
  };

  const toggleLike = async () => {
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
  
      const userId = session?.session?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'User not logged in.');
        return;
      }
  
      const maKH = await getMaKHFromUserId(userId);
      if (!maKH) {
        Alert.alert('Error', 'Unable to fetch MaKH.');
        return;
      }
  
      if (isLiked) {
        // Remove from Liked table
        const { error: deleteError } = await supabase
          .from('likedProduct')
          .delete()
          .eq('productid', id)
          .eq('makh', maKH);
  
        if (deleteError) throw deleteError;
  
        // Update Product table
        await supabase
          .from('Product')
          .update({ Liked: liked - 1 })
          .eq('id', id);
  
        setLiked(liked - 1);
      } else {
        // Add to Liked table
        const { error: insertError } = await supabase
          .from('likedProduct')
          .insert([{ productid: id, makh: maKH }]);
  
        if (insertError) throw insertError;
  
        // Update Product table
        await supabase
          .from('Product')
          .update({ Liked: liked + 1 })
          .eq('id', id);
  
        setLiked(liked + 1);
      }
  
      setIsLiked(!isLiked);
      checkIfLiked();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update like status.');
    }
  };
  

  const handleBuyNow = () => {
    navigation.navigate('Purchase', {
      id: id,  
      name: productName,
      price: Number(price),  
      quantity: quantity, 
      image: image,
    });
  };

  const checkIfLiked = async () => {
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
  
    const userId = session?.session?.user?.id;
    if (!userId) return;
  
    const maKH = await getMaKHFromUserId(userId);
    if (!maKH) return;
  
    const { data: likedData } = await supabase
      .from('likedProduct')
      .select('id')
      .eq('productid', id)
      .eq('makh', maKH)
      .single();

    setIsLiked(!!likedData);
  };

  const star = (rating: number) => {
    const fullStars = Math.min(Math.floor(rating), 5); 
    const halfStar = rating % 1 >= 0.5 && fullStars < 5; 
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
    let stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Icon key={`full-${i}`} name="star" size={18} color="#FFD700" />);
    }
    if (halfStar) {
      stars.push(<Icon key="half" name="star-half-o" size={18} color="#FFD700" />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Icon key={`empty-${i}`} name="star-o" size={18} color="#FFD700" />);
    }
  
    return stars;
  };

  if (isLoading) {
    return (
      <View style={style.loadingContainer}>
        <ActivityIndicator size="large" color="#111111" />
      </View>
    );
  }

  const images = Array.isArray(imageProduct) ? imageProduct : [];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.floor(contentOffsetX / itemWidth);  
    setCurrentIndex(index);
  };

  return (
    <View style={style.mainContainer}>
      
      <ScrollView style={style.scrollContainer}>
        <TouchableOpacity style={style.goBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        
        <View style={style.carouselContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToAlignment="center"
            snapToInterval={itemWidth}
            style={style.carouselScrollView}
            onScroll={handleScroll}
          >
            {images.length > 0 ? (
            images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={style.carouselImage} />
            ))
          ) : (
            <Image source={{ uri: image }} style={style.carouselImage} /> 
          )}
          </ScrollView>

          {images.length > 1 && (
          <View style={style.chevronContainer}>
            {currentIndex === 0 ? (
            <TouchableOpacity
            onPress={() => scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * itemWidth })}
            style={[style.chevronButton, { position: 'absolute', right: 0, top: '50%', transform: [{ translateY: -15 }] }]}
            >
              <Ionicons name="chevron-forward" size={30} color="white" />
            </TouchableOpacity>
          ) : currentIndex < images.length - 1 ? (
            <>
              <TouchableOpacity
              onPress={() => scrollViewRef.current?.scrollTo({ x: (currentIndex - 1) * itemWidth })}
              style={style.chevronButton}
              >
                <Ionicons name="chevron-back" size={30} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
              onPress={() => scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * itemWidth })}
              style={style.chevronButton}
              >
                <Ionicons name="chevron-forward" size={30} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
            onPress={() => scrollViewRef.current?.scrollTo({ x: (currentIndex - 1) * itemWidth })}
            style={[style.chevronButton, { position: 'absolute', left: 0, top: '50%', transform: [{ translateY: -15 }] }]}
            >
            < Ionicons name="chevron-back" size={30} color="white" />
            </TouchableOpacity>
          )}
          </View>
        )}
        </View>
        

        <View style={style.cardContainer}>
          <Text style={style.productTitle}>{productName}</Text>
          <TouchableOpacity style={style.shop} onPress={()=>navigation.navigate('ShopInterface',{idShop})}>
            <Text style={style.shopName}>{shopName}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" style={style.arrowIcon} />
          </TouchableOpacity>
          <View style={style.number}>
            <Text style={style.productPrice}>{formatPrice }</Text>

            <View style={style.ratingContainer}>
              {star(rating)}
              {rating >= 5 ? (
                <Text style={style.ratingText}> (5)</Text>  
              ) : (
                <Text style={style.ratingText}> ({rating})</Text>
              )}
          </View>
          </View>

          <View style={style.number}>

            <Text style={style.productPrice}>Đã bán: {sold}</Text>

            <View style={style.likedRow}>
              <Text style={style.productPrice}>Đã thích: {liked}</Text>
              <TouchableOpacity style={style.heartIcon} onPress={toggleLike}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "red" : "#888"} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={style.productDescription}>{productDescription}</Text>
        </View>
      </ScrollView>

      <View style={style.bottomButtonsContainer}>
        <TouchableOpacity style={style.addToCartButton} onPress={handleAdd}>
          <Ionicons name="cart-outline" size={15} color="#FFF"/>
          <Text style={style.addToCartText}>Thêm giỏ hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={style.buyNowButton} onPress={handleBuyNow}>
          <Text style={style.buyNowText}>Mua ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    paddingBottom: 90, 
  },
  goBackButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#efefef',
    marginTop: 20,
    marginLeft: 15,
    width: 45,
  },
  productImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  productImage: {
    width: 330,
    height: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd', 
    paddingBottom: 10, 
    marginBottom: 10, 
  },
  shopName: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
    
    paddingBottom: 5, 
  },
  productPrice: {
    fontSize: 18,
    color: '#333',
    marginVertical: 10,

  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
    
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    marginVertical: 10,
    
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    flex: 1,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    justifyContent: 'space-between',
  },
  addToCartButton: {
    backgroundColor: '#4caf50',
    flex: 0.5,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  likedRow:{
    flexDirection: 'row',
  },
  buyNowButton: {
    backgroundColor: '#111111',
    flex: 0.5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number:{
    flexDirection: 'row',
    borderBottomWidth: 0.5, 
    borderBottomColor: '#ddd', 
    alignItems: 'center',
    justifyContent: 'space-between', 
  },
  arrowIcon: {
    marginLeft: 10, 
  },
  shop:{
    flexDirection: 'row',
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd', 
    alignItems: 'center',
    justifyContent: 'space-between', 
  },
  carouselContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  carouselScrollView: {
    width: '100%',
  },
  carouselItem: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  carouselImage: {
    width: itemWidth ,
    height: 250,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  heartIcon:{
    marginTop: 10,
  },
  chevronContainer: {
    position: 'absolute',
    top: '50%',  
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  chevronButton: {
    padding: 10,
  },
});
