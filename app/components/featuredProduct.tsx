import { View, Text, StyleSheet, TouchableWithoutFeedback, Image, Alert } from 'react-native';
import React from 'react';
import { bgColor } from '../themes';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamList } from '../navigation/Data';

type navigationProp = NativeStackNavigationProp<ParamList, 'Product'>;

export default function FeaturedProduct({ id, name, detail, price, image, rating }: any) {

  const displayRating = rating >= 0 ? rating : 0;
  
  const formatPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'VND',
  }).format(price);

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

  const navigation = useNavigation<navigationProp>();

  const handlePress = () => {
    if (id && name && detail && image && rating !== undefined && price) {
      navigation.navigate('Product', { id });
    } else {
      console.error('Missing required product data:', { id, name, detail, image, rating, price });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={[style.cardContainer, { backgroundColor: bgColor.bgcolor }]}>
        <Image style={style.cardImage} source={{ uri: image }} />
        <View style={style.separator} />
        <View style={style.cardDetails}>
          <Text style={style.cardTitle} numberOfLines={1} ellipsizeMode="tail">
            {name || 'Product Name'}
          </Text>
          <Text style={style.cardContent}>{formatPrice || 'Price not available'}</Text>
          <View style={style.ratingContainer}>
            {star(displayRating || 0)}
            {displayRating >= 5 ? (
              <Text style={style.ratingText}> (5)</Text>  // Show "(5)" if rating is 5 or higher
            ) : (
              <Text style={style.ratingText}> ({displayRating})</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const style = StyleSheet.create({
  cardContainer: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },

  cardImage: {
    height: 180,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#F2F2F2',
  },

  separator: {
    height: 0.5, 
    width: '100%',
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },

  cardDetails: {
    paddingHorizontal: 10,
    paddingTop: 5, 
    paddingBottom: 5, 
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6, 
  },

  cardContent: {
    fontSize: 15,
    color: '#555',
    marginTop: 0.2, 
    lineHeight: 20,
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6, 
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
});
