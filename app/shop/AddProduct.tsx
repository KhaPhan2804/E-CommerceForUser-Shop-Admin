import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image ,Switch, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import ParamList from '../navigation/Data';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

type AddProductRouteProp = RouteProp<ParamList, 'AddProduct'>;


type Category = {
  id: number;
  name: string;
  image: string;
}


export default function AddProduct() {
  const navigation = useNavigation();
  const route = useRoute<AddProductRouteProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [selectedMethods, setSelectedMethods] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const maxProductNameLength = 240;
  const maxProductDescriptionLength = 3000;
  const {idShop} = route.params;

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

  

  const handleProductNameChange = (text: string) => {
    setProductName(text);
  };

  const handleDescriptionChange = (text: string) => {
    setProductDescription(text); 
  };

  const toggleCategorySelection = (id: number) => {
    setSelectedCategories([id]); 
    setIsDropdownVisible(false); 
  };


  const handlePriceChange = (text: string) => {
    const cleanedPrice = text.replace(/[^0-9]/g, '');
    setPrice(cleanedPrice ? parseInt(cleanedPrice, 10) : 0);
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };
  
  const handleStockChange = (text: string) => {
    const parsedStock = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setStock(parsedStock);
  };

  const handleWeightChange = (text: string) => {
    const parsedStock = parseInt(text.replace(/[^0-9]/g, ''), 10);
    setWeight(parsedStock);
  };

  const handleToggle = (id: number) => {
    setSelectedMethods((prevSelectedMethods) => {
      if (prevSelectedMethods.includes(id)) {
        return prevSelectedMethods.filter(methodId => methodId !== id);
      } else {
        return [...prevSelectedMethods, id];
      }
    });
  };
  

  const calculateShippingFee = (basicFee: number, weight: number) => {
    if (weight <= 500) return basicFee;
    const extraWeight = weight - 500;
    return basicFee + Math.ceil(extraWeight / 50) * 5000;
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
  
      const fileName = `productImage/${idShop}_${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
  
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
  

  
  const handleSave = async () => {

    if (!productName || !productDescription || selectedCategories.length === 0 || price <= 0 || stock <= 0 || weight <= 0 || selectedMethods.length === 0 || selectedImages.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin vào tất cả các trường bắt buộc.');
      return; 
    }

    const shippingFees: { [key: string]: string } = {};

    const productCategory = selectedCategories.length > 0 ? selectedCategories[0] : null;

    


    const imageUrl = await uploadImage(selectedImages[0]);
    const imageProductUrls = await Promise.all(selectedImages.map((img, index) => uploadImage(img)));

    const productData = {
      name: productName,
      detail: productDescription,
      price: price,
      Stock: stock,
      productCategory: productCategory,
      Weight: weight,
      shipfee: shippingFees,  
      image: imageUrl,
      imageProduct: imageProductUrls,
      status: 'Pending',
      rating: 0,
      Liked: 0,
      Watched: 0,
      Sold: 0,
      shopId: idShop,
    };

    console.log(productData)

    try {
      
      const { data, error } = await supabase
        .from('Product')  
        .insert([productData]);  
  
      if (error) {
        console.error('Error saving data:', error.message);
      } else {
        console.log('Product data saved successfully!');
        navigation.goBack();  
      }
    } catch (err) {
      console.error('Unexpected error while saving:', err);
    }
  }
  
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
    } catch (err) {
      console.error('handleDeleteImage unexpected error:', err);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa ảnh.');
    }
  };
  
  useEffect(() => {
    fetchCategoryData();
    
  },[]);

  return (
    <View style = {styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm sản phẩm mới</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.card}>
          <View style={styles.labelContainer}>
            <Text style={styles.cardLabel}>Hình ảnh sản phẩm</Text>
            <Text style={styles.requiredStar}>*</Text> 
          </View>
          <View style={styles.imagesContainer}>
            {selectedImages.map((imgUri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: imgUri }} style={styles.productImage} />
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteImage(imgUri)}>
                  <Ionicons name="close-outline" size={13} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedImages.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Text style={styles.addImageButtonText}>Thêm hình ảnh</Text>
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
            <Text style={styles.wordCount}>{`${productDescription.length}/${maxProductDescriptionLength}`}</Text>
          </View>
          <TextInput 
            style={styles.productDescriptionInput}
            value={productDescription}
            onChangeText={handleDescriptionChange}
            placeholder="Nhập mô tả sản phẩm"
            maxLength={maxProductDescriptionLength} 
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.labelRow}>
           
            <Text style={styles.cardLabel}>
              <Ionicons name="options-outline" size={15} color="black"/>
              Ngành hàng
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity 
              style={styles.chooseButton} 
              onPress={() => setIsDropdownVisible(!isDropdownVisible)}
            >
              <Text style={styles.chooseButtonText}>
              {selectedCategories.length > 0
                ? categories.find(cat => cat.id === selectedCategories[0])?.name
                : "Chọn ngành hàng"}
            </Text>
            </TouchableOpacity>
          </View>

          {isDropdownVisible && (
          <View style={styles.dropdownListContainer}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#3498db" />
             ) : (
              categories.map((item) => (
                <View key={item.id} style={styles.dropdownItem}>
                <Checkbox
                  status={selectedCategories.includes(item.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleCategorySelection(item.id)}
                />
            <Text style={styles.dropdownItemText}>{item.name}</Text>
            </View>
            ))
          )}
        </View>
        )}
      
        </View>

        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>
              <Ionicons name="pricetag-outline" size={15} color="black"/>
              Giá
              <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formatPrice(price)}
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

        <View style={styles.card} >
          <View style={styles.labelRow}>
            <Text style={styles.cardLabel}>
              <Ionicons name="clipboard-outline" size={12} color="black"/>
              Trọng lượng
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={weight? `${weight} g` : ''}
              onChangeText={handleWeightChange}
              placeholder="Nhập trọng lượng sản phẩm"
              keyboardType="numeric"
            />
          </View>
        </View>

      <TouchableOpacity style={styles.addButton} onPress={handleSave}>
        <Text style={styles.addButtonText}>Thêm sản phẩm</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  )
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
  requiredStar: {
    color: 'red', 
    fontSize: 18, 
  },
  imagesContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    flexWrap: 'wrap',
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordCount: {
    fontSize: 14,
    color: '#666',
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
  chooseButton: {
    paddingVertical: 5,
    paddingHorizontal: 30,
    backgroundColor: '#111111',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  chooseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownListContainer: {
    maxHeight: 400,  
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 5,
    
    padding: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  input: {
    padding: 10,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
  },
  shippingMethodCard: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  methodText: {
    fontSize: 13,
  },
  shippingMethodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingFee: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, 
  },
  productImage: {
    width: 100, 
    height: 100,
    borderRadius: 10,
    resizeMode: 'cover',
    borderWidth: 0.3,
    marginLeft: 5,
  },
  noImageText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#111111',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0, 
    marginHorizontal: 0, 
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
});