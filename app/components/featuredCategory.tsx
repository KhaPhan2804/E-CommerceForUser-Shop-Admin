import { View, Text,StyleSheet, TouchableOpacity,ScrollView, Image} from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigation } from 'expo-router'
import supabase from '../database/supabase';
import { bgColor } from '../themes';
import ParamList from '../navigation/Data';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native';

type navigationProp = NativeStackNavigationProp<ParamList,'Category'>

type Category = {
    id: string;
    name: string;
    image: string;
};


export default function featuredCategory() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string|null>(null);
    const navigation = useNavigation<navigationProp>();
    const fetchCategory = async () =>{
        const {data, error} = await supabase.from('Category').select('*');
        if(error){
          console.error('Error: ', error);
        }else{
          setCategories(data || []);
        }
    }
    
    useFocusEffect(
        useCallback(() => {
          fetchCategory();
        }, [])
    );
    
    const handleCategoryPress = (category:Category) => {
        setActiveCategory(category.id);
        navigation.navigate('Category', {categoryId: category.id, categoryName: category.name});
    }; 

  return (
    <View style={style.container}>
      <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={style.scrollViewContent}>
        {
            categories.map((category,index) => {
                const isActive = category.id === activeCategory;
                return(
                    <View key={index} style={style.categoryContainer}>
                        <TouchableOpacity
                        onPress={()=> handleCategoryPress(category)}
                        style={[
                            style.button,
                        ]}>
                            <Image style={style.image} source={{uri: category.image}}/>
                        </TouchableOpacity>
                        <Text style={[style.text, isActive? style.textActive : style.textInActive]}>
                            {category.name}
                        </Text>
                    </View>
                )
            })
        }
      </ScrollView>
    </View>
  )
}
const style = StyleSheet.create({
    container: {
      marginTop: 0,
    },
    scrollViewContent: {
      paddingHorizontal: 16, 
    },
    categoryContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12, 
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 10, 
      backgroundColor: '#F2F2F2', 
      borderWidth: 1,
      borderColor: '#E0E0E0', 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2, 
    },
    buttonActive: {
      backgroundColor: '#3E3E3E', 
      borderColor: '#3E3E3E', 
    },
    buttonInActive: {
      backgroundColor: '#F2F2F2', 
    },
    image: {
      width: 30, 
      height: 30,
    },
    text: {
      fontSize: 16, 
      marginTop: 8, 
      fontWeight: '400', 
      color: '#333', 
    },
    textActive: {
      fontWeight: '600', 
      color: '#3E3E3E', 
    },
    textInActive: {
      color: '#A0AEC0', 
    },
  });
  