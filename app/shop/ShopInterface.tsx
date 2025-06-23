import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import FeaturedProduct from '../components/featuredProduct';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

type navigationProp = NativeStackNavigationProp<ParamList,'Category'>

type ShopInterfaceRouteProp = RouteProp<ParamList, 'ShopInterface'>;


type product = {
  id: number;
  name: string;
  detail: string;
  price: number;
  productCategory: number;
  image: string;
  rating: string;
};

type Category = {
  id: string;
  name: string;
  image: string;
};

type ChatRoom = {
  id: number;
  shop_id: number;
  user_id: number;
  created_at: string;
};

export default function ShopInterface() {
  const navigation = useNavigation<navigationProp>();
  const route = useRoute<ShopInterfaceRouteProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('Shop');
  const [product, setProduct] = useState<product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});
  const [shopName, setShopName] = useState('');
  const [shopavatar, setShopAvatar] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [followers, setFollowers] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [showDecorateInputs, setShowDecorateInputs] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [mainBanner, setMainBanner] = useState<string | null>(null);
  const [footBanner, setFootBanner] = useState<string | null>(null);
  
  const {idShop} = route.params;

  const handleCategoryPress = (category:Category) => {
    navigation.navigate('Category', {categoryId: category.id, categoryName: category.name});
  }; 

  const fetchProduct = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
    .from('Product')
    .select('*')
    .eq('shopId',idShop)
    .eq('status','Instock');
    
    if (error) {
      console.error('Error: ', error);
    } else {
      setProduct(data);
      countProductsByCategory(data); 
    }
    setIsLoading(false);
  };

 

  const fetchCategory = async () => {
    const { data, error } = await supabase.from('Category').select('*');
    if (error) {
      console.error('Error: ', error);
    } else {
      setCategories(data);
    }
  };

  const updateShopRating = async () => {
    const { data: products, error } = await supabase
      .from('Product')
      .select('rating')
      .eq('shopId', idShop);
  
    if (error) {
      console.error('Error fetching product ratings:', error);
      return;
    }
  
    if (!products || products.length === 0) {
      return;
    }
  
    const totalRating = products.reduce((sum, product) => sum + parseFloat(product.rating || "0"), 0);
    const averageRating = (totalRating / products.length).toFixed(1);
  
    // Update shop rating
    const { error: updateError } = await supabase
      .from('shop')
      .update({ rating: averageRating })
      .eq('id', idShop);
  
    if (updateError) {
      console.error('Error updating shop rating:', updateError);
    } else {
      setRating(parseFloat(averageRating));
    }
  };

  const countProductsByCategory = (products: product[]) => {
    const counts: { [key: string]: number } = {};
    products.forEach((product) => {
      if (counts[product.productCategory]) {
        counts[product.productCategory]++;
      } else {
        counts[product.productCategory] = 1;
      }
    });
    setCategoryCounts(counts);
  };

  useEffect(() => {
    fetchProduct();
    fetchShopData();
    fetchCategory();
    fetchFollowStatus();
  }, []);

  const fetchShopData = async () => {
    setIsLoading(true);
  
    const { data: shopProfile, error: shopProfileError } = await supabase
      .from('shop')
      .select('*')
      .eq('id', idShop)
      .single();
  
    if (shopProfileError) {
      console.log('Error fetching shop data:', shopProfileError.message);
      setIsLoading(false);
      return;
    }
  
    const { data: banners, error: bannersError } = await supabase
      .from('shopbanners')
      .select('*')
      .eq('shop_id', idShop)
      .single();
  
    if (bannersError) {
      console.log('Error fetching banners:', bannersError.message);
    } else if (banners) {
      setMainBanner(banners.main_banner);
      setFootBanner(banners.foot_banner);
      setSelectedImages(banners.body_banner ? banners.body_banner : []);
    }
  
    if (shopProfile) {
      setShopAvatar(shopProfile.shopavatar);
      setShopName(shopProfile.shopname);
      setFollowers(shopProfile.followers);
      updateShopRating();
    }

    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (!sessionError && session?.session?.user?.id) {
      const userId = session.session.user.id;
      const maKH = await getMaKHFromUserId(userId);
      if (maKH && shopProfile && shopProfile.makh === maKH) {
        setIsShopOwner(true);
      }
    }
  
    setIsLoading(false);
  };

  const handleSaveBanners = async () => {
    try {
      const updates = {
        shop_id: idShop,
        main_banner: mainBanner,
        foot_banner: footBanner,
        body_banner: selectedImages, 
        updated_at: new Date().toISOString(),
      };

      const { data: existingBanner, error: fetchError } = await supabase
      .from('shopbanners')
      .select('*')
      .eq('shop_id', idShop)
      .single();

      if (fetchError && fetchError.code !== 'PGRST116') { 
        console.error('Error fetching banners:', fetchError.message);
        Alert.alert('Lỗi', 'Không thể kiểm tra banner. Vui lòng thử lại.');
        return;
      }
  
      if (existingBanner) {
      const { error } = await supabase
        .from('shopbanners')
        .update(updates)
        .eq('shop_id', idShop); 
        
      if (error) {
        console.error('Error updating banners:', error.message);
        Alert.alert('Lỗi', 'Không thể lưu ảnh. Vui lòng thử lại.');
        return;
      }
      
      Alert.alert('Thành công', 'Ảnh đã được cập nhật!');
    } else {
      
      const { error } = await supabase
        .from('shopbanners')
        .upsert(updates); 
        
      if (error) {
        console.error('Error saving banners:', error.message);
        Alert.alert('Lỗi', 'Không thể lưu ảnh. Vui lòng thử lại.');
        return;
      }
      
      Alert.alert('Thành công', 'Ảnh đã được lưu!');
    }
      setShowDecorateInputs(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu ảnh.');
    }
  };
  

  const handleFollowToggle = async () => {
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
  
      const userId = session?.session?.user?.id;
      if (!userId) {
        Alert.alert('Thông báo', 'Bạn cần đăng nhập để theo dõi cửa hàng.');
        return;
      }
  
      const maKH = await getMaKHFromUserId(userId);
      if (!maKH) {
        Alert.alert('Lỗi', 'Không thể lấy MaKH.');
        return;
      }
  
      if (isFollowing) {
        // Unfollow shop
        const { error: unfollowError } = await supabase
          .from('shopfollowers')
          .delete()
          .eq('user_id', maKH)
          .eq('shop_id', idShop);
  
        if (unfollowError) throw unfollowError;
  
        setFollowers(followers - 1);
        await supabase
          .from('shop')
          .update({ followers: followers - 1 })
          .eq('id', idShop);
      } else {
        // Follow shop
        const { error: followError } = await supabase
          .from('shopfollowers')
          .insert([{ user_id: maKH, shop_id: idShop, followed_at: new Date().toISOString() }]);
  
        if (followError) throw followError;
  
        setFollowers(followers + 1);
        await supabase
          .from('shop')
          .update({ followers: followers + 1 })
          .eq('id', idShop);
      }
  
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái theo dõi.');
    }
  };

  const fetchFollowStatus = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return;
  
      const maKH = await getMaKHFromUserId(userId);
      if (!maKH) return;
  
      const { data, error } = await supabase
        .from('shopfollowers')
        .select('*')
        .eq('user_id', maKH)
        .eq('shop_id', idShop)
        .single();
  
      if (error && error.code !== 'PGRST116') console.error('Error fetching follow status:', error);
  
      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error fetching follow status:', err);
    }
  };

  const CNCChatRoom = async (idShop: number) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return;
  
      const maKH = await getMaKHFromUserId(userId);
      if (!maKH) return;

      const { data, error } = await supabase
        .from('chat_rooms')  
        .select('id')  
        .eq('shop_id', idShop)
        .eq('user_id', maKH)
        .single();  
  
      if (error) {
        if (error.code === 'PGRST116') {  
          const { data: newRoomData, error: roomCreationError } = await supabase
            .from('chat_rooms') 
            .insert([{ shop_id: idShop, user_id: maKH, created_at: new Date().toISOString() }])
            .single(); 
  
          if (roomCreationError) {
            console.log('Error creating chat room:', roomCreationError);
          } else {
            if ((newRoomData as ChatRoom)?.id) {
              navigation.navigate('Chat', { shop_id: idShop, room_id: (newRoomData as ChatRoom).id });
            }
          }
        } else {
          console.log('Error fetching chat room:', error);
        }
      } else if (data) {
        if (data.id) {
          navigation.navigate('Chat', { shop_id: idShop, room_id: data.id });
        }
      }
    } catch (error) {
      console.log('Error in checking or creating chat room:', error);
    }
  };
  

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

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
  };

  const handleSearch = async () => {
    navigation.navigate('SearchShop', {idShop});
  }

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;
  
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
  
      if (result.canceled) return;
  
      if (result.assets && result.assets.length > 0) {
        for (let asset of result.assets) {
          const localUri = asset.uri;
  
          try {
            const { publicUrl } = await uploadImage(localUri);
            
            setSelectedImages((prevImages) => [...prevImages, publicUrl]);
          } catch (uploadErr) {
            console.error('Upload failed for image:', localUri, uploadErr);
          }
        }
      }
    } catch (error) {
      Alert.alert('Không thể tải ảnh lên ', 'Vui lòng thử lại');
    }
  };
  
  const pickMainBanner = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;
  
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
  
      if (result.canceled) return;
  
      if (result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const { publicUrl } = await uploadImage(localUri);
        setMainBanner(publicUrl);
      }
    } catch (error) {
      Alert.alert('Không thể tải ảnh lên', 'Vui lòng thử lại');
    }
  };

  const pickFootBanner = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;
  
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
  
      if (result.canceled) return;
  
      if (result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const { publicUrl } = await uploadImage(localUri);
        setFootBanner(publicUrl);
      }
    } catch (error) {
      Alert.alert('Không thể tải ảnh lên', 'Vui lòng thử lại');
    }
  };
  

  const uploadImage = async (selectedImage: string): Promise<{ publicUrl: string; filePath: string }> => {
    if (!selectedImage) {
      throw new Error('No image selected!');
    }
  
    try {
      const fileUri = selectedImage;
      const fileInfo = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      const byteCharacters = atob(fileInfo);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
  
      const fileName = `bannerImages/${idShop}_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
  
      const { error } = await supabase.storage
        .from('image')
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
        });
  
      if (error) {
        throw error;
      }
  
      const { data: publicUrlData } = await supabase.storage
        .from('image')
        .getPublicUrl(fileName);
  
      if (publicUrlData?.publicUrl) {
        console.log('Image uploaded successfully:', publicUrlData.publicUrl);
        return {
          publicUrl: publicUrlData.publicUrl,
          filePath: fileName, 
        };
      }
  
      throw new Error('Failed to get public URL for the uploaded image');
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };
  


  const requestPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access media library is required.');
          return false;
        }
        return true;
    };

  const handleDeleteImage = async (imgUri: string) => {
      try {
        const supabasePublicPrefix = 'https://njulzxtvzglbrsxdgbcq.supabase.co/storage/v1/object/public/image/';
        
        if (!imgUri.startsWith(supabasePublicPrefix)) {
          console.warn('Not a Supabase image:', imgUri);
          return;
        }

        const filePath = imgUri.replace(supabasePublicPrefix, '');
    
        console.log('Deleting Supabase filePath:', filePath);
    
        const { error } = await supabase.storage
          .from('image') 
          .remove([filePath]);
    
        if (error) {
          console.error('Supabase deletion error:', error.message);
          Alert.alert('Lỗi', 'Không thể xóa ảnh khỏi Supabase.');
          return;
        }
    
        console.log('Image deleted from Supabase!');
        Alert.alert('Thông báo', 'Xóa ảnh thành công');
        setSelectedImages(prev => prev.filter(img => img !== imgUri));
        if (mainBanner === imgUri) {
          setMainBanner(null);
        }
        if (footBanner === imgUri) {
          setFootBanner(null);
        }
      } catch (err) {
        console.error('handleDeleteImage unexpected error:', err);
        Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa ảnh.');
      }
    };
    
    
    
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearch}
        >
          <Text style={styles.searchText}>
            Tìm kiếm sản phẩm trong {shopName}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <View style={styles.shopInfoContainer}>
          {shopavatar? (
            <Image source={{ uri: shopavatar }} style={styles.shopAvatar} />
          ) : (
            <View style={styles.iconContainer}>
              <Ionicons name="storefront-outline" size={40} color="#888" />
            </View>
          )}

          <View style={styles.shopDetails}>
            <View style={styles.topRow}>
              <Text style={styles.shopName}>{shopName}</Text>
              <TouchableOpacity onPress={handleFollowToggle} style={styles.followButton}>
                {isFollowing ? (
                <>
                  <Ionicons name="checkmark" size={15} color="black" />
                  <Text style={styles.buttonText}>Đang theo dõi</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-outline" size={15} color="black" />
                  <Text style={styles.buttonText}>Theo dõi</Text>
                </>
              )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.shopStats}>
                {rating} <Ionicons name="star" size={10} color="#f39c12" />
                | {followers} Người đang theo dõi
              </Text>
            {!isShopOwner ? (
              <TouchableOpacity style={styles.chatButton} onPress={async () => {
                await CNCChatRoom(idShop);  
              }}>
                <Ionicons name="chatbox-ellipses-outline" size={15} color="black" />
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            ):(
              <TouchableOpacity style={styles.chatButton} onPress={() => {
                navigation.navigate('Response', {shop_id:idShop}); 
              }}>
                <Ionicons name="chatbox-ellipses-outline" size={15} color="black" />
                <Text style={styles.chatButtonText}>Trả lời khách hàng</Text>
              </TouchableOpacity>
            )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.tabContainer}>
        {['Shop', 'Sản phẩm', 'Danh mục sản phẩm'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.selectedTab]}
            onPress={() => handleTabSelect(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.selectedTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.contentContainer}>
      
      {selectedTab === 'Shop' && (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ styles.decorateContainer}>
      
      {mainBanner ? (
        <Image source={{ uri: mainBanner }} style={styles.mainBannerImage} />
      ) : (
        <Text>Chưa trang trí banner</Text>
      )}

      <View style={styles.imagesContainer}>
      {selectedImages.length > 0 && selectedImages.map((img, index) => (
      <View key={index} style={styles.imageWrapper}>
        <Image source={{ uri: img }} style={styles.bannerImage} />
      </View>
      ))}
      </View>

      {footBanner ? (
      <Image source={{ uri: footBanner }} style={styles.footBannerImage} />
      ) : (
      <Text></Text>
      )}

      {isShopOwner && (
      <TouchableOpacity
        style={styles.decorateButton}
        onPress={() => setShowDecorateInputs(!showDecorateInputs)}
      >
        <Text style={styles.decorateButtonText}>
          {showDecorateInputs ? 'Đóng chỉnh sửa' : 'Trang trí ngay'}
        </Text>
      </TouchableOpacity>
    )}

    {showDecorateInputs && (
      <View style={styles.decorateSection}>

        <View style={styles.card}>
          <View style={styles.labelContainer}>
            <Text style={styles.cardLabel}>Banner chính</Text>
          </View>
          {mainBanner ? ( 
            <View style={styles.imageWrapper}>
            <Image source={{ uri: mainBanner }} style={styles.mainBannerImage} />
            <TouchableOpacity style={styles.deleteButton} onPress={()=>handleDeleteImage(mainBanner)}>
              <Ionicons name="close-outline" size={13} color="white" />
            </TouchableOpacity>
          </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={pickMainBanner}>
              <Text style={styles.addImageButtonText}>
              <Ionicons name="add-outline" size={30} color="black" />
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.card}>
          <View style={styles.labelContainer}>
            <Text style={styles.cardLabel}>Banner phụ</Text>
          </View>
          <View style={styles.imagesContainer}>
            {selectedImages.map((imgUri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: imgUri }} style={styles.bannerImage} />
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteImage(imgUri)}>
                <Ionicons name="close-outline" size={13} color="white" />
              </TouchableOpacity>
            </View>
            ))}
            {selectedImages.length < 5 && (
              <TouchableOpacity style={styles.addImageButton1} onPress={pickImage}>
                <Text style={styles.addImageButtonText}>
                  <Ionicons name="add-outline" size={25} color="black" />
                </Text>
              </TouchableOpacity>
             )}
          </View>
         </View>

         <View style={styles.card}>
          <View style={styles.labelContainer}>
            <Text style={styles.cardLabel}>Banner thêm</Text>
          </View>
          {footBanner ? ( 
            <View style={styles.imageWrapper}>
            <Image source={{ uri: footBanner }} style={styles.footBannerImage} />
            <TouchableOpacity style={styles.deleteButton} onPress={()=>handleDeleteImage(footBanner)}>
              <Ionicons name="close-outline" size={13} color="white" />
            </TouchableOpacity>
          </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={pickFootBanner}>
              <Text style={styles.addImageButtonText}>
              <Ionicons name="add-outline" size={30} color="black" />
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveBanners}>
          <Text style={styles.saveButtonText}>Lưu ảnh</Text>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
  )}

        {selectedTab === 'Sản phẩm' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.productList}>
            <View style={styles.row1}>
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
                <Text style={styles.noResults}>Không có sản phẩm nào</Text>
              )}
            </View>
          </ScrollView>
        )}
        {selectedTab === 'Danh mục sản phẩm' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {categories
          .filter((category) => categoryCounts[category.id] > 0) 
          .map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
          >
          <View style={styles.categoryCardContent}>
            <Text style={styles.categoryName}>
              {category.name} ({categoryCounts[category.id] || 0} sản phẩm)
            </Text>
          </View>
            <Ionicons name="chevron-forward" size={20} color="#888" style={styles.arrowIcon} />
          </TouchableOpacity>
          ))}
        </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    justifyContent: 'center',
  },
  searchText: {
    fontSize: 16,
    color: '#888',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 5,
    width: '100%',  
    justifyContent: 'space-between',  
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
  },
  categoryCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  productList: {
    paddingBottom: 180, 
  },

  arrowIcon: {
    marginLeft: 10, 
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  row1: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  productItem: {
    width: '50%',  
    marginBottom: 20,  
    padding: 5,  
    alignItems: 'center',  
  },
  
  bannerImage: {
    width: 100,
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    marginRight: 10,
    marginBottom: 10,
  },

  mainBannerImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    marginRight: 10,
    marginBottom: 10,
  },

  footBannerImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    marginRight: 10,
    marginBottom: 10,
  },

  productName: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  productPrice: {
    color: '#f39c12',
    marginTop: 5,
  },
  productRating: {
    color: '#888',
    marginTop: 5,
  },
  noResults: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  shopInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  shopAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  shopDetails: {
    flexDirection: 'column',
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shopStats: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    borderWidth: 1,
    borderColor: '#111111',
    paddingVertical: 3,
    paddingHorizontal: 10,
    flexDirection: 'row',
  },
  chatButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#111111',
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 1,
  },
  chatButtonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 1,
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 0,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  selectedTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorateSection: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  decorateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  addImageButton: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderStyle: 'dashed',
  },
  addImageButton1: {
    width: 100,
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderStyle: 'dashed',
  },
  addImageButton2: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderStyle: 'dashed',
  },
  addImageButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  toggleButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  decorateContainer:{
    width: 330,
    paddingBottom: 250, 
  },
  decorateButton:{
    borderColor:'#111111',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  decorateButtonText:{
    color: '#111111',
    fontWeight: 'bold', 
    textAlign: 'center'
  },
  imageWrapper: {
    position: 'relative', 
    marginRight: 10,
    marginBottom: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  imagesContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  saveButton: {
    marginTop: 20,
    borderColor: "#111111",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
});
