import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 
import supabase from '../database/supabase';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ParamList from '../navigation/Data';

type navigationProp = NativeStackNavigationProp<ParamList, 'ProductSetting'>;

type Category = {
  id: number;
  name: string;
  image: string;
};

export default function CategorySetting() {
  const navigation = useNavigation<navigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const route = useRoute();
  const { categoryName, productId } = route.params as { categoryName: string | number, productId: number };

  useEffect(() => {
    fetchCategoryData();
  }, []);

  const fetchCategoryData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('Category').select('*');
      if (error) {
        console.error('Error fetching categories:', error.message);
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = async (newCategory: number) => {
    if (newCategory) {
      try {
        const { error } = await supabase
          .from('Product')  
          .update({ productCategory: newCategory })  
          .eq('id', productId);  

        if (error) {
          console.error('Error updating category:', error.message);
          return;
        }
        navigation.goBack();
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    } else {
      console.error("Invalid category ID");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Chọn ngành hàng</Text>
      </View>

      {isLoading ? <ActivityIndicator size="large" color="#111111" /> : null}

      <View style={styles.listContainer}>
        {categories.map((category, index) => {
          const isSelected = category.id === categoryName;

          return (
            <TouchableOpacity 
              key={category.id} 
              style={[styles.listItem, index === categories.length - 1 && { borderBottomWidth: 0 }]} 
              onPress={() => handleCategoryChange(category.id)} 
            >
              <Text style={[styles.listText, isSelected && styles.selectedText]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    marginTop: 10,
  },
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  listText: {
    fontSize: 16,
  },
  selectedText: {
    color: '#007bff', 
    fontWeight: 'bold',
  },
});
