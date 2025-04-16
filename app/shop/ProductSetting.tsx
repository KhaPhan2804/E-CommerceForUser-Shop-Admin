import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ParamList from '../navigation/Data';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

type ProductSettingRouteProp = RouteProp<ParamList, 'ProductSetting'>;

type navigationProp = NativeStackNavigationProp<ParamList, 'CategorySetting'>;

type Category = {
  id: number;
  name: string;
  image: string;
}

type Product = {
  id: number;
  name: string;
  price: number;
  image: string; 
  Stock: number;
  detail: string;
  shipfee: string;
  productCategory: number;
  Weight: number;
  shippingMethod: string;
  imageProduct: string;
};

export default function ProductSetting() {
  const navigation = useNavigation<navigationProp>();
  const route = useRoute<ProductSettingRouteProp>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productName, setProductName] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryNameState, setCategoryName] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0); 
  const [weight, setWeight] = useState<number>(0);
  const [shippingMethod, setShippingMethod] = useState('');
  const [minShippingFee, setMinShippingFee] = useState<number>(0);
  const [maxShippingFee, setMaxShippingFee] = useState<number>(0);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(true);
  const [imageProduct, setImageProduct] = useState<string[]>([]);
  
  const maxProductNameLength = 120; 
  const maxDescriptionLength = 3000; 
 
  const { productId, idShop } = route.params;

  const fetchProductData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('id', productId)
        .single(); 

      if (error) {
        console.error('Error fetching product data:', error.message);
      } else {
        setProduct(data); 
        setProductName(data.name);
        setProductDescription(data.detail); 
        setPrice(data.price);
        setStock(data.Stock);
        setWeight(data.Weight);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Category')
        .select('*'); 

      if (error) {
        console.error('Error fetching categories:', error.message);
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally{
      setIsLoading(false); 
    }
  };
  
  const fetchProductCategory = async (productId: number) => {
    setIsLoading(true);
    const {data, error} = await supabase
    .from('Product')
    .select('productCategory')
    .eq('id',productId)
    .single();
    if(error){
      console.log("Error fetching data: ", error.message)
    }else{
      setCategoryName(data.productCategory);  
    }
    setIsLoading(false);
  }

  const getCategoryName = (categoryId: number) => {
    if (isLoading) {
      return 'Loading categories...';
    }
  
    if (!categories.length) {
      return 'Unknown Category';
    }
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const handleHidden = async (productId: number) => {
    const { error } = await supabase
    .from('Product')
    .update({ status: 'Hidden' })
    .eq('id', productId);
    if(error){
      console.log('The hidden button dont work', error.message);
    }
    navigation.goBack();
  };

  const fetchShipfee = async (productId: number) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .eq('id', productId)
      .single();
  
    if (error) {
      console.log('Error fetching data: ', error.message);
    } else {
      
      if (data && data.shipfee) {
        try {
          const shipfeeJson = data.shipfee as Record<string, string>;
  
          const fees: number[] = Object.values(shipfeeJson).map(fee => {
            const numericValue = fee.replace(/[^0-9.-]+/g, '').replace('.', ''); 
            return parseFloat(numericValue); 
          });
  
          if (fees.length > 0) {
            const minFee = Math.min(...fees);
            const maxFee = Math.max(...fees);
            setMinShippingFee(minFee);
            setMaxShippingFee(maxFee);
            setShippingMethod(data.shippingMethod);
            setWeight(data.Weight);
          }
        } catch (err) {
          console.error('Error parsing shipfee:', err);
        }
      }
    }
    setIsLoading(false);
  };

  const fetchImageProduct = async (productId: number) => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('Product')
      .select('imageProduct') 
      .eq('id', productId)
      .single();

    console.log(data);
    
    if (error) {
      console.error("Error fetching data:", error.message);
    } else if (data?.imageProduct) {
      try {
        
        const images = typeof data.imageProduct === "string"
          ? JSON.parse(data.imageProduct)
          : data.imageProduct;
  
        setImageProduct(images); 
      } catch (parseError) {
        console.error("Error parsing imageProduct:", parseError);
      }
    }
  
    setIsLoading(false);
  };
  
  
  useEffect(() => {
    fetchProductData();
    fetchCategoryData(); 
    fetchImageProduct(productId);
  }, [productId]);
  
  useFocusEffect(
    React.useCallback(() => {
      fetchProductCategory(productId);
      fetchShipfee(productId);
    }, [productId]) 
  );

  if (isLoading) {
    return <ActivityIndicator size="large" color="#111111" style={styles.loader} />;
  }



  const handleDeleteImage = async (imgUri: string) => {
    try {
      // Remove the image from the selected images state
      setSelectedImages((prevImages) => prevImages.filter((img) => img !== imgUri));
  
      // Remove the image from the database (Supabase)
      await removeImageFromDatabase(imgUri);
  
      // Delete the image from Supabase Storage
      await deleteImageFromStorage(imgUri);

      fetchImageProduct(productId);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xóa ảnh. Vui lòng thử lại.");
    }
  };
  
  

  const removeImageFromDatabase = async (imgUri: string) => {
    const { data, error } = await supabase
      .from('Product') 
      .update({
        imageProduct: images.filter((img) => img !== imgUri), 
      })
      .eq('id', productId); 
  
    if (error) {
      console.error('Error updating database:', error);
      throw new Error(error.message);
    }
  };

  const deleteImageFromStorage = async (imgUri: string) => {
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
    } catch (err) {
      console.error('handleDeleteImage unexpected error:', err);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa ảnh.');
    }
  };
  
  
  

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };
  

  const handleProductNameChange = (text: string) => {
    setProductName(text);
  };

  const handleDescriptionChange = (text: string) => {
    setProductDescription(text); 
  };

  const handlePriceChange = (text: string) => {
    const cleanedPrice = text.replace(/[^0-9]/g, '');
    setPrice(cleanedPrice ? parseInt(cleanedPrice, 10) : 0);
  };

  const handleStockChange = (text: string) => {
    const parsedStock = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setStock(parsedStock);
  };
  
  const handleUpdateProduct = async () => {
    setIsLoading(true); 
  
    try {
      const numericPrice = parseInt(price.toString().replace(/[^0-9]/g, ''), 10);
  
      const { data, error } = await supabase
        .from('Product')
        .update({
          name: productName,
          detail: productDescription,
          price: numericPrice,
          Stock: stock,
        })
        .eq('id', productId); 

      if (error) {
        console.error('Error updating product:', error.message);
      } else {
        if (idShop === null) {
        console.error("Error: idShop is null");
        return;
        }
        navigation.navigate('ShopProduct', { idShop }); 
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false); 
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
          const selectedImgUrls = result.assets.map((asset) => asset.uri);
          setSelectedImages((prevImages) => [...prevImages, ...selectedImgUrls]);
          for (let imgUri of selectedImgUrls) {
            await uploadImage(imgUri);
          }
        }
      } catch (error) {
        Alert.alert('Không thể tải ảnh lên ', 'Vui lòng thử lại');
      }
    };

    const images = Array.isArray(imageProduct) ? imageProduct : [];


    const uploadImage = async (selectedImage: string) => {
      if (!selectedImage) {
        alert('No image selected!');
        return;
      }
  
      setUploading(true);
  
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
  
        const fileName = `productImage/${idShop}_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
  
        const { data, error } = await supabase.storage
          .from('image')
          .upload(fileName, byteArray, {
            contentType: 'image/jpeg',
          });
  
        if (error) {
          throw error;
        }
  
        const { data: publicUrlData } = supabase
          .storage
          .from('image')
          .getPublicUrl(fileName);

        
        if(publicUrlData?.publicUrl){
          updateImageProduct(publicUrlData.publicUrl);
        }
  
        Alert.alert('Cập nhật ảnh thành công', 'Hình ảnh của bạn đã được cập nhật');
      } catch (error) {
        Alert.alert('Cập nhật ảnh không thành công', 'Đã có vấn đề xảy ra khi cập nhật ảnh');
      } finally {
        setUploading(false);
      }
    };
  
    const updateImageProduct = async (newImageUrl: string) => {
      try {
        // Fetch the current product data to get the existing images
        const { data: existingProduct, error: fetchError } = await supabase
          .from('Product')
          .select('imageProduct')
          .eq('id', productId)
          .single();  // Get only one record
    
        if (fetchError) {
          console.error('Error fetching existing product data:', fetchError.message);
          return;
        }
    
        // Ensure imageProduct is an array (or an empty array if it's null or undefined)
        const currentImages = Array.isArray(existingProduct?.imageProduct)
          ? existingProduct?.imageProduct
          : [];
    
        // Add the new image URL to the existing images array if the new image is not already present
        const updatedImages = [...currentImages, newImageUrl];
    
        // Now update the database with the updated images array
        const { error: updateError } = await supabase
          .from('Product')
          .update({
            imageProduct: updatedImages,  // Updated images array with the new image
          })
          .eq('id', productId);  // Ensure you're updating the correct product by ID
    
        if (updateError) {
          console.error('Error updating imageProduct:', updateError.message);
        } else {
          console.log('Image uploaded and updated successfully');
          fetchProductData();  // Fetch updated data after saving the URL
          fetchImageProduct(productId);
        }
      } catch (err) {
        console.error('Unexpected error during update:', err);
      }
    };
    

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Chỉnh sửa sản phẩm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.card}>
          <View style={styles.labelContainer}>
            <Text style={styles.cardLabel}>Hình ảnh sản phẩm</Text>
            <Text style={styles.requiredStar}>*</Text> 
          </View>
          
          <View style={styles.imagesContainer}>
          
          {Array.isArray(product?.imageProduct) && product.imageProduct.length > 0 &&
            images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img }} style={styles.productImage} />
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteImage(img)}>
                  <Ionicons name="close-outline" size={13} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {product?.image && (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <View style={styles.coverLabel}>
                  <Text style={styles.coverLabelText}>Ảnh bìa</Text>
                </View>
              </View>
            )}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Text style={styles.addImageButtonText}>Hình ảnh</Text>
              </TouchableOpacity>
            )}
            
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>Tên sản phẩm
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Text style={styles.wordCount}>{`${productName.length}/${maxProductNameLength}`}</Text>
          </View>
          <TextInput 
            style={styles.productNameInput}
            value={productName}
            onChangeText={handleProductNameChange}
            placeholder="Nhập tên sản phẩm"
            maxLength={maxProductNameLength} 
          />
        </View>

        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>Mô tả sản phẩm
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Text style={styles.wordCount}>{`${productDescription.length}/${maxDescriptionLength}`}</Text>
          </View>
          <TextInput 
            style={styles.productDescriptionInput}
            value={productDescription}
            onChangeText={handleDescriptionChange}
            placeholder="Nhập mô tả sản phẩm"
            maxLength={maxDescriptionLength} 
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.card} 
        onPress={()=>navigation.navigate('CategorySetting',{categoryName: categoryNameState, productId,})}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>
            <Ionicons name="options-outline" size={15} color="black"/>
            Ngành hàng
            <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Text style={styles.productCategory}>
            {getCategoryName(categoryNameState)}
            <Ionicons name="chevron-forward-outline" size={12} color="black" />
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>
            <Ionicons name="pricetag-outline" size={15} color="black"/>
            Giá
            <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={price ? formatPrice(price) : ''}
              onChangeText={handlePriceChange}
              placeholder="Nhập giá sản phẩm"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.card} >
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>
            <Ionicons name="cube-outline" size={12} color="black"/>
            Tồn kho
            <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={stock ? stock.toString() : ''}
              onChangeText={handleStockChange}
              placeholder="Nhập số lượng tồn kho"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.card}
        onPress={()=>navigation.navigate('ShippingFee',{productId: productId, weight: weight,
          shippingMethod: shippingMethod
          })}
        >
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>
            <Ionicons name="airplane-outline" size={15} color="black"/>
            Phí vận chuyển
            <Text style={styles.requiredStar}>*</Text>
            
            </Text>
            <Text style={styles.productCategory}>
            <Text style={styles.shippingFee}>
            {minShippingFee !== null && maxShippingFee !== null 
            ? `${formatPrice(minShippingFee)} - ${formatPrice(maxShippingFee)}`
            : 'Loading...'}
            </Text>
            <Ionicons name="chevron-forward-outline" size={12} color="black" />
            </Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.hiddenButton} onPress={() => product?.id && handleHidden(product.id)}>
          <Text style={styles.buttonhiddenText}>Ẩn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProduct}>
          <Text style={styles.buttonupdateText}>Cập nhật</Text>
        </TouchableOpacity>
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
    padding: 15,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  shippingFee: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  requiredStar: {
    color: 'red', 
    fontSize: 18, 
  },
  input: {
    padding: 10,
    fontSize: 16,
    borderColor: '#ddd',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productCategory: {
    fontSize: 16,
    color: '#333',
  },
  wordCount: {
    fontSize: 14,
    color: '#666',
  },
  imagesContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  imageWrapper: {
    position: 'relative', 
    marginRight: 10,
    marginBottom: 10,
  },
  productImage: {
    width: 100, 
    height: 100,
    borderRadius: 10,
    resizeMode: 'cover',
    borderWidth: 0.3,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
  addImageButton: {
    width: 100, 
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderStyle: 'dashed', 
  },
  addImageButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productDetails: {
    marginTop: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 16,
    color: '#e67e22',
    marginBottom: 10,
  },
  productDetail: {
    fontSize: 14,
    color: '#777',
  },
  productNameInput: {
    padding: 10,
    fontSize: 16,
  },
  productDescriptionInput: {
    padding: 10,
    fontSize: 16,
    height: 100,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 1,
  },
  hiddenButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderColor: '#111111',
    borderWidth: 1,
  },
  buttonhiddenText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonupdateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coverLabel: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  coverLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});